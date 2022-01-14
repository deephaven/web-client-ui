import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import Log from '@deephaven/log';
import { PromiseUtils } from '@deephaven/utils';
import { MonacoCompletionProvider, MonacoTheme, MonacoUtils } from './monaco';
import './ConsoleInput.scss';
import StoragePropTypes from './StoragePropTypes';

const log = Log.module('ConsoleInput');

const LINE_HEIGHT = parseInt(MonacoTheme['line-height'], 10);
const TOP_PADDING = 6;
const BOTTOM_PADDING = 6;
const MIN_INPUT_HEIGHT = LINE_HEIGHT + TOP_PADDING + BOTTOM_PADDING;
const BUFFER_SIZE = 100;

/**
 * Component for input in a console session. Handles loading the recent command history
 */
export class ConsoleInput extends PureComponent {
  static INPUT_CLASS_NAME = 'console-input';

  constructor(props) {
    super(props);

    this.handleWindowResize = this.handleWindowResize.bind(this);

    this.cancelListener = null;
    this.commandContainer = React.createRef();
    this.commandEditor = null;
    this.commandHistoryIndex = null;
    this.commandSuggestionContainer = null;
    this.loadingPromise = null;
    this.timestamp = Date.now();
    this.bufferIndex = 0;
    this.history = [];
    // Tracks every command that has been modified by its commandHistoryIndex. Cleared on any command being executed
    this.modifiedCommands = new Map();

    this.state = {
      commandEditorHeight: LINE_HEIGHT,
      isFocused: false,
      model: null,
    };
  }

  componentDidMount() {
    this.initCommandEditor();

    window.addEventListener('resize', this.handleWindowResize);

    this.loadMoreHistory();
  }

  componentDidUpdate() {
    this.layoutEditor();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);

    if (this.loadingPromise != null) {
      this.loadingPromise.cancel();
    }

    this.destroyCommandEditor();
  }

  /**
   * Sets the console text from an external source.
   * Sets commandHistoryIndex to null since the source is not part of the history
   * @param {string} text The text to set in the input
   * @param {boolean} focus If the input should be focused
   * @param {boolean} execute If the input should be executed
   * @returns void
   */
  setConsoleText(text, focus = true, execute = false) {
    if (!text) {
      return;
    }

    log.debug('Command received: ', text);

    // Need to set commandHistoryIndex before value
    // On value change, modified commands map updates
    this.commandHistoryIndex = null;
    this.commandEditor.setValue(text);

    if (focus) {
      this.focusEnd();
    }

    this.updateDimensions();

    if (execute) {
      this.processCommand();
    }
  }

  initCommandEditor() {
    const { language, session } = this.props;
    const commandSettings = {
      copyWithSyntaxHighlighting: 'false',
      cursorStyle: 'block',
      fixedOverflowWidgets: true,
      folding: false,
      fontFamily: 'Fira Mono',
      glyphMargin: false,
      language,
      lineHeight: LINE_HEIGHT,
      lineDecorationsWidth: 3,
      lineNumbers: 'off',
      minimap: { enabled: false },
      renderLineHighlight: 'none',
      scrollBeyondLastLine: false,
      scrollbar: {
        arrowSize: 0,
        horizontal: 'hidden',
        horizontalScrollbarSize: 0,
      },
      padding: {
        top: TOP_PADDING,
        bottom: BOTTOM_PADDING,
      },
      tabCompletion: 'on',
      value: '',
      wordWrap: 'on',
    };

    this.commandEditor = monaco.editor.create(
      this.commandContainer.current,
      commandSettings
    );

    MonacoUtils.setEOL(this.commandEditor);
    MonacoUtils.openDocument(this.commandEditor, session);

    this.commandEditor.onDidChangeModelContent(() => {
      this.modifiedCommands.set(
        this.commandHistoryIndex,
        this.commandEditor.getValue()
      );
      this.updateDimensions();
    });

    this.commandEditor.onDidFocusEditorText(() => {
      this.setState({ isFocused: true });
    });

    this.commandEditor.onDidBlurEditorText(() => {
      this.setState({ isFocused: false });
    });

    /**
     * Register for keydown events to capture the `Enter` key.
     * Need to do it this way instead of using `addCommand`, because that would eat the Enter key in all situations, which is not what we want.
     * Can't do it in `onDidChangeModelContent` either, since we want to stop the Enter action from modifying the command.
     */
    this.commandEditor.onKeyDown(keyEvent => {
      const { commandEditor, commandHistoryIndex } = this;
      const { lineNumber } = commandEditor.getPosition();
      const model = commandEditor.getModel();
      if (keyEvent.keyCode === monaco.KeyCode.UpArrow && lineNumber === 1) {
        if (commandHistoryIndex != null) {
          this.loadCommand(commandHistoryIndex + 1);
        } else {
          this.loadCommand(0);
        }

        this.focusStart();
        keyEvent.stopPropagation();
        keyEvent.preventDefault();

        return;
      }

      if (
        keyEvent.keyCode === monaco.KeyCode.DownArrow &&
        lineNumber === model.getLineCount()
      ) {
        if (commandHistoryIndex != null && commandHistoryIndex > 0) {
          this.loadCommand(commandHistoryIndex - 1);
        } else {
          this.loadCommand(null);
        }

        this.focusEnd();
        keyEvent.stopPropagation();
        keyEvent.preventDefault();

        return;
      }

      if (!keyEvent.altKey && !keyEvent.shiftKey && !keyEvent.metaKey) {
        if (keyEvent.keyCode === monaco.KeyCode.Enter) {
          if (!this.isSuggestionMenuPopulated()) {
            keyEvent.stopPropagation();
            keyEvent.preventDefault();

            this.processCommand();
          }
        } else if (keyEvent.keyCode === monaco.KeyCode.Tab) {
          if (!this.isSuggestionMenuActive()) {
            keyEvent.stopPropagation();
            keyEvent.preventDefault();

            this.commandEditor.trigger(
              'Tab key trigger suggestions',
              'editor.action.triggerSuggest',
              {}
            );
          } else if (!this.isSuggestionMenuPopulated()) {
            keyEvent.stopPropagation();
            keyEvent.preventDefault();
          }
        }
      }
    });

    // Override the Ctrl+F functionality so that the find window doesn't appear
    this.commandEditor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_F, // eslint-disable-line no-bitwise
      () => {}
    );

    MonacoUtils.removeConflictingKeybindings(this.commandEditor);

    MonacoUtils.registerPasteHandler(this.commandEditor);

    this.commandEditor.focus();

    this.updateDimensions();

    this.setState({ model: this.commandEditor.getModel() });
  }

  destroyCommandEditor() {
    const { session } = this.props;
    if (this.commandEditor) {
      MonacoUtils.closeDocument(this.commandEditor, session);
      this.commandEditor.dispose();
      this.commandEditor = null;
    }
  }

  handleWindowResize() {
    this.updateDimensions();
  }

  isSuggestionMenuActive() {
    if (!this.commandSuggestionContainer) {
      this.commandSuggestionContainer = this.commandEditor
        .getDomNode()
        .querySelector('.suggest-widget');
    }

    return (
      this.commandSuggestionContainer &&
      this.commandSuggestionContainer.classList.contains('visible')
    );
  }

  isSuggestionMenuPopulated() {
    return (
      this.isSuggestionMenuActive() &&
      this.commandSuggestionContainer.querySelector('.monaco-list-rows')
        .childElementCount > 0
    );
  }

  focus() {
    this.commandEditor.focus();
  }

  focusStart() {
    const model = this.commandEditor.getModel();
    const column = model.getLineLength(1) + 1; // Length of 1st line
    const firstCharTop = this.commandEditor.getTopForPosition(1, column);
    this.commandEditor.setPosition({ lineNumber: 1, column });
    this.commandEditor.setScrollTop(firstCharTop);
    this.commandEditor.focus();
  }

  focusEnd() {
    const model = this.commandEditor.getModel();
    const lastLine = model.getLineCount();
    const column = model.getLineLength(lastLine) + 1;
    const lastCharTop = this.commandEditor.getTopForPosition(lastLine, column);
    this.commandEditor.setPosition({ lineNumber: lastLine, column });
    this.commandEditor.setScrollTop(lastCharTop);
    this.commandEditor.focus();
  }

  clear() {
    this.commandEditor.focus();
    this.commandEditor.getModel().setValue('');
    this.commandHistoryIndex = null;
  }

  layoutEditor() {
    if (this.commandEditor) {
      this.commandEditor.layout();
    }
  }

  /**
   * Loads the given command from history
   * If edits have been made to the command since last run command, loads the modified version
   * @param {number | null} index The index to load. Null to load command started in the editor and not in the history
   */
  loadCommand(index) {
    let value = '';
    if (index !== null && index < this.history.length) {
      value = this.history[this.history.length - index - 1];

      if (index > this.history.length - BUFFER_SIZE) {
        this.loadMoreHistory();
      }
    }

    this.commandHistoryIndex = index;
    value = this.modifiedCommands.get(index) ?? value;
    this.commandEditor.getModel().setValue(value);
  }

  async loadMoreHistory() {
    try {
      if (this.loadingPromise != null || this.bufferIndex == null) {
        return;
      }

      const { commandHistoryStorage, language, scope } = this.props;

      this.loadingPromise = PromiseUtils.makeCancelable(
        commandHistoryStorage.getTable(language, scope, this.timestamp),
        resolved => resolved.close()
      );

      const table = await this.loadingPromise;
      table.setReversed(true);
      table.setViewport({
        top: this.bufferIndex,
        bottom: this.bufferIndex + BUFFER_SIZE - 1,
      });

      this.loadingPromise = PromiseUtils.makeCancelable(
        table.getViewportData(),
        () => table.close()
      );
      const viewportData = await this.loadingPromise;
      this.bufferIndex += BUFFER_SIZE;
      if (this.bufferIndex >= table.size) {
        // We've loaded the full history, no need to load any more
        this.bufferIndex = null;
      }
      this.history = [
        ...viewportData.items.map(({ name }) => name).reverse(),
        ...this.history,
      ];

      this.loadingPromise = null;

      table.close();
    } catch (err) {
      this.loadingPromise = null;
      if (PromiseUtils.isCanceled(err)) {
        log.debug2('Promise canceled, not loading history');
        return;
      }

      log.error('Error fetching history', err);
    }
  }

  processCommand() {
    this.commandHistoryIndex = null;
    this.modifiedCommands.clear();

    const command = this.commandEditor.getValue().trim();
    this.history.push(command);
    this.commandEditor.setValue('');
    this.updateDimensions();

    const { onSubmit } = this.props;
    onSubmit(command);
  }

  updateDimensions() {
    if (!this.commandEditor) {
      return;
    }

    const { maxHeight } = this.props;
    const contentHeight = this.commandEditor.getContentHeight();
    const commandEditorHeight = Math.max(
      Math.min(contentHeight, maxHeight),
      MIN_INPUT_HEIGHT
    );

    // Only show the overview ruler (markings overlapping sroll bar area) if the scrollbar will show
    const shouldScroll = contentHeight > commandEditorHeight;
    const options = this.commandEditor.getOptions();
    if (shouldScroll) {
      options.overviewRulerLanes = undefined; // Resets to default
    } else {
      options.overviewRulerLanes = 0;
    }

    this.setState(
      {
        commandEditorHeight,
      },
      () => {
        this.commandEditor.updateOptions(options);
        this.commandEditor.layout();
      }
    );
  }

  render() {
    const { language, session } = this.props;
    const { commandEditorHeight, isFocused, model } = this.state;
    return (
      <div className="console-input-wrapper">
        <div
          className={classNames('console-input-inner-wrapper', {
            focus: isFocused,
          })}
        >
          <div
            className={ConsoleInput.INPUT_CLASS_NAME}
            ref={this.commandContainer}
            style={{ height: commandEditorHeight }}
          />
          {model && (
            <MonacoCompletionProvider
              model={model}
              language={language}
              session={session}
            />
          )}
        </div>
      </div>
    );
  }
}

ConsoleInput.propTypes = {
  session: PropTypes.shape({}).isRequired,
  language: PropTypes.string.isRequired,
  scope: PropTypes.string,
  commandHistoryStorage: StoragePropTypes.CommandHistoryStorage.isRequired,
  onSubmit: PropTypes.func.isRequired,
  maxHeight: PropTypes.number,
};

ConsoleInput.defaultProps = {
  maxHeight: LINE_HEIGHT * 10,
  scope: null,
};

export default ConsoleInput;
