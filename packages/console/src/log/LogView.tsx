import React, { PureComponent, ReactElement } from 'react';
import { Button, DropdownActions, DropdownMenu } from '@deephaven/components';
import { vsGear, dhTrashUndo } from '@deephaven/icons';
import { assertNotNull } from '@deephaven/utils';
import { IdeSession, LogItem } from '@deephaven/jsapi-shim';
import { Placement } from 'popper.js';
import * as monaco from 'monaco-editor';
import ConsoleUtils from '../common/ConsoleUtils';
import LogLevel from './LogLevel';
import './LogView.scss';
import LogLevelMenuItem from './LogLevelMenuItem';

interface LogViewProps {
  session: IdeSession;
}

interface LogViewState {
  shownLogLevels: Record<string, boolean>;
}
/**
 * Log view contents. Uses a monaco editor to display/search the contents of the log.
 */
class LogView extends PureComponent<LogViewProps, LogViewState> {
  static DefaultLogLevels = [
    LogLevel.STDOUT,
    LogLevel.ERROR,
    LogLevel.FATAL,
    LogLevel.STDERR,
    LogLevel.WARN,
  ];

  static AllLogLevels = [
    LogLevel.INFO,
    LogLevel.STDOUT,
    LogLevel.ERROR,
    LogLevel.FATAL,
    LogLevel.STDERR,
    LogLevel.WARN,
    LogLevel.DEBUG,
    LogLevel.TRACE,
  ];

  /** ms to buffer log messages before processing them */
  static bufferTimeout = 16;

  /** Maximum number of messages to store in the log */
  static maxLogSize = 131072;

  static truncateSize = 65536;

  static getLogText(logItem: LogItem): string {
    const date = new Date(logItem.micros / 1000);
    const timestamp = ConsoleUtils.formatTimestamp(date);
    return `${timestamp} ${logItem.logLevel} ${logItem.message}`;
  }

  constructor(props: LogViewProps) {
    super(props);

    this.handleClearClick = this.handleClearClick.bind(this);
    this.handleFlushTimeout = this.handleFlushTimeout.bind(this);
    this.handleLogMessage = this.handleLogMessage.bind(this);
    this.handleMenuItemClick = this.handleMenuItemClick.bind(this);
    this.handleResetClick = this.handleResetClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleToggleAllClick = this.handleToggleAllClick.bind(this);

    this.logLevelMenuItems = {};

    this.editorContainer = null;

    this.bufferedMessages = [];
    this.messages = [];

    this.state = {
      shownLogLevels: {},
    };
  }

  componentDidMount(): void {
    this.resetLogLevels();
    this.initMonaco();
    this.startListening();

    window.addEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps: LogViewProps, prevState: LogViewState): void {
    this.updateDimensions();

    const { shownLogLevels } = this.state;
    if (prevState.shownLogLevels !== shownLogLevels) {
      this.refreshLogText();
    }

    const { session } = this.props;
    if (prevProps.session !== session) {
      this.stopListening();
      this.startListening();
      // clear logs when starting a new console
      this.clearLogs();
    }
  }

  componentWillUnmount(): void {
    this.stopFlushTimer();
    this.stopListening();
    this.destroyMonaco();

    window.removeEventListener('resize', this.handleResize);
  }

  cancelListener?: () => void | null;

  editor?: monaco.editor.IStandaloneCodeEditor;

  editorContainer: HTMLDivElement | null;

  logLevelMenuItems: Record<string, LogLevelMenuItem>;

  flushTimer?: ReturnType<typeof setTimeout>;

  bufferedMessages: LogItem[];

  messages: LogItem[];

  getMenuActions(shownLogLevels: Record<string, boolean>): DropdownActions {
    const actions = [];

    actions.push({
      menuElement: (
        <div className="log-level-menu-title">Display Log Levels</div>
      ),
      group: 1,
      order: 10,
    });

    for (let i = 0; i < LogView.AllLogLevels.length; i += 1) {
      const logLevel = LogView.AllLogLevels[i];
      const on =
        shownLogLevels[logLevel] != null ? shownLogLevels[logLevel] : false;
      actions.push({
        title: logLevel,
        group: 1,
        order: i + 100,

        menuElement: (
          <LogLevelMenuItem
            logLevel={logLevel}
            on={on}
            onClick={this.handleMenuItemClick}
            ref={element => {
              if (element != null) {
                this.logLevelMenuItems[logLevel] = element;
              }
            }}
          />
        ),
      });
    }

    actions.push({
      group: 1,
      order: 1000,
      menuElement: (
        <div className="log-level-menu-controls">
          <Button
            kind="ghost"
            className="log-level-toggle-all"
            onClick={this.handleToggleAllClick}
          >
            Toggle All
          </Button>
          <Button kind="ghost" onClick={this.handleResetClick}>
            Reset
          </Button>
        </div>
      ),
    });

    return actions;
  }

  resetLogLevels(): void {
    const shownLogLevels: Record<string, boolean> = {};
    for (let i = 0; i < LogView.AllLogLevels.length; i += 1) {
      const logLevel = LogView.AllLogLevels[i];
      const isEnabled = LogView.DefaultLogLevels.indexOf(logLevel) >= 0;
      shownLogLevels[logLevel] = isEnabled;
    }

    this.setState({ shownLogLevels });
  }

  startListening(): void {
    const { session } = this.props;
    this.cancelListener = session.onLogMessage(this.handleLogMessage);
  }

  stopListening(): void {
    if (this.cancelListener != null) {
      this.cancelListener();
      this.cancelListener = undefined;
    }
  }

  initMonaco(): void {
    assertNotNull(this.editorContainer);
    this.editor = monaco.editor.create(this.editorContainer, {
      copyWithSyntaxHighlighting: false,
      fixedOverflowWidgets: true,
      folding: false,
      fontFamily: 'Fira Mono',
      glyphMargin: false,
      language: 'log',
      lineDecorationsWidth: 0,
      // I commented this out since '' is not a valid parameter for line Numbers
      // lineNumbers: '',
      lineNumbersMinChars: 0,
      minimap: { enabled: false },
      readOnly: true,
      renderLineHighlight: 'none',
      scrollBeyondLastLine: false,
      value: '',
      wordWrap: 'on',
    });

    // When find widget is open, escape key closes it.
    // Instead, capture it and do nothing. Same for shift-escape.
    this.editor.addCommand(monaco.KeyCode.Escape, () => undefined);
    this.editor.addCommand(
      // eslint-disable-next-line no-bitwise
      monaco.KeyMod.Shift | monaco.KeyCode.Escape,
      () => undefined
    );

    // Restore regular escape to clear selection, when editorText has focus.
    this.editor.addCommand(
      monaco.KeyCode.Escape,
      () => {
        const position = this.editor?.getPosition();
        assertNotNull(position);
        this.editor?.setPosition(position);
      },
      'findWidgetVisible && editorTextFocus'
    );

    this.editor.addCommand(
      // eslint-disable-next-line no-bitwise
      monaco.KeyMod.Shift | monaco.KeyCode.Escape,
      () => {
        const position = this.editor?.getPosition();
        assertNotNull(position);
        this.editor?.setPosition(position);
      },
      'findWidgetVisible && editorTextFocus'
    );
  }

  destroyMonaco(): void {
    if (this.editor) {
      this.editor.dispose();
      this.editor = undefined;
    }
  }

  triggerFindWidget(): void {
    // The actions.find action can no longer be triggered when the editor is not in focus, with monaco 0.22.x.
    // As a workaround, just focus the editor before triggering the action
    // https://github.com/microsoft/monaco-editor/issues/2355
    this.editor?.focus();
    this.editor?.trigger('keyboard', 'actions.find', undefined);
  }

  toggleAll(): void {
    const { shownLogLevels } = this.state;
    let isAllEnabled = true;
    for (let i = 0; i < LogView.AllLogLevels.length; i += 1) {
      const logLevel = LogView.AllLogLevels[i];
      if (!shownLogLevels[logLevel]) {
        isAllEnabled = false;
        break;
      }
    }

    if (isAllEnabled) {
      this.setState({ shownLogLevels: {} });
    } else {
      const updatedLogLevels: Record<string, boolean> = {};
      for (let i = 0; i < LogView.AllLogLevels.length; i += 1) {
        const logLevel = LogView.AllLogLevels[i];
        updatedLogLevels[logLevel] = true;
      }
      this.setState({ shownLogLevels: updatedLogLevels });
    }
  }

  toggleLogLevel(logLevel: string): void {
    const { shownLogLevels } = this.state;
    const isEnabled = shownLogLevels[logLevel];
    const updatedLogLevels: Record<string, boolean> = {};
    updatedLogLevels[logLevel] = !isEnabled;
    this.updateLogLevels(updatedLogLevels);
  }

  updateLogLevels(updatedLogLevels: Record<string, boolean>): void {
    let { shownLogLevels } = this.state;
    shownLogLevels = { ...shownLogLevels, ...updatedLogLevels };
    this.setState({ shownLogLevels });
  }

  appendLogText(text: string): void {
    if (!this.editor) {
      return;
    }

    const model = this.editor.getModel();
    let line = model?.getLineCount();
    assertNotNull(line);
    let column = model?.getLineLength(line);
    assertNotNull(column);
    const isBottomVisible = this.isBottomVisible();

    const edits = [];
    if (column > 0) {
      edits.push({
        range: {
          startLineNumber: line,
          startColumn: column + 1,
          endLineNumber: line,
          endColumn: column + 1,
        },
        text: '\n',
        forceMoveMarkers: true,
      });
      line += 1;
      column = 0;
    }

    edits.push({
      range: {
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: column,
      },
      text,
      forceMoveMarkers: true,
    });

    model?.applyEdits(edits);

    if (isBottomVisible) {
      const lineCount = model?.getLineCount();
      assertNotNull(lineCount);
      this.editor.revealLine(lineCount, 1);
    }
  }

  /**
   * Refresh the contents of the log component with the updated filter text
   */
  refreshLogText(): void {
    if (!this.editor) {
      return;
    }

    this.truncateLogIfNecessary();

    const { shownLogLevels } = this.state;
    const isBottomVisible = this.isBottomVisible();

    let text = '';
    for (let i = 0; i < this.messages.length; i += 1) {
      const message = this.messages[i];
      if (shownLogLevels[message.logLevel]) {
        const logText = LogView.getLogText(message);
        if (logText.length > 0) {
          text += logText;
          if (logText.charAt(logText.length - 1) !== '\n') {
            text += '\n';
          }
        }
      }
    }
    text = text.trimRight();

    this.editor.setValue(text);

    if (isBottomVisible) {
      const line = this.editor.getModel()?.getLineCount();
      assertNotNull(line);
      this.editor.revealLine(line, 1);
    }

    this.stopFlushTimer();
    this.bufferedMessages = [];
  }

  truncateLogIfNecessary(): void {
    if (this.messages.length > LogView.maxLogSize) {
      this.messages = this.messages.splice(
        this.messages.length - LogView.truncateSize
      );
    }
  }

  scrollToBottom(): void {
    if (!this.editor) {
      return;
    }

    const line = this.editor?.getModel?.()?.getLineCount();
    assertNotNull(line);
    this.editor.revealLine(line, 1);
  }

  isBottomVisible(): boolean {
    if (!this.editor) {
      return true;
    }

    const model = this.editor.getModel();
    const line = model?.getLineCount();

    assertNotNull(line);
    return this.isLineVisible(line);
  }

  isLineVisible(line: number): boolean {
    const visibleRanges = this.editor?.getVisibleRanges();
    if (visibleRanges == null || visibleRanges.length === 0) {
      return false;
    }

    for (let i = 0; i < visibleRanges.length; i += 1) {
      const range = visibleRanges[i];
      if (range.startLineNumber <= line && line <= range.endLineNumber) {
        return true;
      }
    }

    return false;
  }

  /** Checks if the given log message is visible with the current filters */
  isLogItemVisible(message: LogItem): boolean {
    const { shownLogLevels } = this.state;
    return shownLogLevels[message.logLevel];
  }

  flush(): void {
    let text = '';
    for (let i = 0; i < this.bufferedMessages.length; i += 1) {
      const message = this.bufferedMessages[i];
      const logText = LogView.getLogText(message);
      text += logText;
      if (logText.charAt(logText.length - 1) !== '\n') {
        text += '\n';
      }
    }

    this.bufferedMessages = [];

    this.appendLogText(text);
  }

  queue(message: LogItem): void {
    this.bufferedMessages.push(message);
    if (this.bufferedMessages.length === 1) {
      this.flushTimer = setTimeout(
        this.handleFlushTimeout,
        LogView.bufferTimeout
      );
    }
  }

  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  updateDimensions(): void {
    if (this.editor) {
      this.editor.layout();
    }
  }

  handleClearClick(): void {
    this.clearLogs();
  }

  clearLogs(): void {
    this.messages = [];
    this.refreshLogText();
  }

  handleFlushTimeout(): void {
    this.stopFlushTimer();
    this.flush();
  }

  handleLogMessage(message: LogItem): void {
    this.messages.push(message);

    if (this.editor && this.isLogItemVisible(message)) {
      this.queue(message);
    }
  }

  handleMenuItemClick(logLevel: string): void {
    this.toggleLogLevel(logLevel);
  }

  handleResetClick(): void {
    this.resetLogLevels();
  }

  handleResize(): void {
    this.updateDimensions();
  }

  handleToggleAllClick(): void {
    this.toggleAll();
  }

  render(): ReactElement {
    const popperOptions = { placement: 'bottom-end' as Placement };
    const { shownLogLevels } = this.state;
    const actions = this.getMenuActions(shownLogLevels);
    return (
      <div className="log-pane h-100 w-100">
        <div className="log-pane-menu">
          <Button
            kind="ghost"
            className="btn-clear-logs"
            onClick={this.handleClearClick}
            icon={dhTrashUndo}
            tooltip="Clear log"
          />
          <Button
            kind="ghost"
            className="btn-link-icon btn-overflow"
            icon={vsGear}
            tooltip="Log Settings"
          >
            <DropdownMenu
              actions={actions}
              popperClassName="log-level-menu-popper"
              popperOptions={popperOptions}
            />
          </Button>
        </div>
        <div
          className="log-pane-editor h-100 w-100"
          ref={editorContainer => {
            this.editorContainer = editorContainer;
          }}
        />
      </div>
    );
  }
}

export default LogView;
