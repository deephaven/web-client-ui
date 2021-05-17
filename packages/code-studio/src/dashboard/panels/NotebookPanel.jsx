// Wrapper for the Notebook for use in a golden layout container
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import memoize from 'memoize-one';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContextActions,
  ContextActionUtils,
  DropdownMenu,
  Tooltip,
} from '@deephaven/components';
import { ScriptEditor, ScriptEditorUtils } from '@deephaven/console';
import {
  vsSave,
  vsKebabVertical,
  dhFileSearch,
  vsPlay,
  vsRunAll,
} from '@deephaven/icons';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import Log from '@deephaven/log';
import { Pending, PromiseUtils } from '@deephaven/utils';
import { ConsoleEvent, NotebookEvent } from '../events';

import './NotebookPanel.scss';
import Panel from './Panel';
import { GLPropTypes } from '../../include/prop-types';

const log = Log.module('NotebookPanel');

const DEBOUNCE_PANEL_STATE_UPDATE = 400;

class NotebookPanel extends Component {
  static COMPONENT = 'NotebookPanel';

  static POPPER_OPTIONS = { placement: 'bottom-end' };

  static DEFAULT_NAME = 'Untitled';

  static handleError(error) {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    log.error(error);
  }

  constructor(props) {
    super(props);

    this.handleBlur = this.handleBlur.bind(this);
    this.handleFind = this.handleFind.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleRunCommand = this.handleRunCommand.bind(this);
    this.handleRunAll = this.handleRunAll.bind(this);
    this.handleRunSelected = this.handleRunSelected.bind(this);
    this.handleSessionOpened = this.handleSessionOpened.bind(this);
    this.handleSessionClosed = this.handleSessionClosed.bind(this);

    this.handleShow = this.handleShow.bind(this);
    this.handleTab = this.handleTab.bind(this);
    this.handleTabFocus = this.handleTabFocus.bind(this);
    this.handleTabBlur = this.handleTabBlur.bind(this);

    this.pending = new Pending();

    this.debouncedSavePanelState = debounce(
      this.savePanelState.bind(this),
      DEBOUNCE_PANEL_STATE_UPDATE
    );

    this.notebook = null;

    this.tabTitleElement = null;
    this.unsavedIndicator = null;
    this.tabInitOnce = false;
    this.shouldPromptClose = true;

    const { isDashboardActive, session, sessionLanguage, panelState } = props;

    let settings = {
      value: '',
    };
    let fileMetadata = null;
    let { isPreview } = props;
    if (panelState) {
      ({
        fileMetadata = fileMetadata,
        isPreview = isPreview,
        settings = settings,
      } = panelState);
    }

    // Not showing the unsaved indicator for null file id and editor content === '',
    // may need to implement some other indication that this notebook has never been saved
    const hasFileId = fileMetadata && !!fileMetadata.id;

    // Unsaved if file id != null and content != null
    // OR file id is null AND content is not null or ''
    const isUnsaved =
      (hasFileId && settings.value != null) || (!hasFileId && settings.value);
    const changeCount = isUnsaved ? 1 : 0;

    this.state = {
      error: null,
      isDashboardActive,
      isFocused: false,
      isLoading: false,
      isLoaded: true,
      isPreview,

      savedChangeCount: 0,
      changeCount,
      fileMetadata,
      settings,

      session,
      sessionLanguage,

      // eslint-disable-next-line react/no-unused-state
      panelState: {
        fileMetadata,
        settings,
      },

      scriptCode: '',
    };

    log.debug('constructor', props, this.state);
  }

  componentDidMount() {
    const {
      glContainer: { tab },
    } = this.props;
    if (tab) this.initTab(tab);
    this.initNotebookContent();
  }

  componentDidUpdate(prevProps, prevState) {
    const { isPreview } = this.state;
    if (isPreview !== prevState.isPreview) {
      this.setPreviewStatus(isPreview);
    }
  }

  componentWillUnmount() {
    this.debouncedSavePanelState.flush();
    this.pending.cancel();

    const { glEventHub } = this.props;

    const { fileMetadata, isPreview } = this.state;
    glEventHub.emit(NotebookEvent.UNREGISTER_FILE, fileMetadata, isPreview);
  }

  // Called by TabEvent. Happens once when created, but also each time its moved.
  // when moved, need to re-init the unsaved indicators on title elements
  initTab(tab) {
    if (!this.tabInitOnce) {
      this.tabInitOnce = true;
    }
    this.initTabClasses(tab);
  }

  initTabClasses(tab) {
    const tabElement = tab.element.get(0);
    const titleElement = tabElement.querySelector('.lm_title');
    this.tabTitleElement = titleElement;
    titleElement.classList.add('notebook-title');
    this.setPreviewStatus();
  }

  getNotebookValue() {
    const { changeCount, savedChangeCount, settings } = this.state;
    const { value } = settings;
    if (changeCount !== savedChangeCount && this.notebook) {
      const notebookValue = this.notebook.getValue();
      return notebookValue != null ? notebookValue : value;
    }
    return value;
  }

  initNotebookContent() {
    // Init from file,
    // fallback to content from settings for unsaved notebook
    const { fileMetadata, settings, isPreview } = this.state;
    if (fileMetadata && fileMetadata.id) {
      log.debug('Init content from file');
      this.registerFileMetadata(fileMetadata, isPreview);
      return;
    }
    if (settings.value != null) {
      log.debug('Use content passed in the settings prop');
      return;
    }
    // No settings, no metadata
    this.handleLoadError(new Error('Missing file metadata'));
  }

  closeFileTabById(id) {
    const { glEventHub } = this.props;
    glEventHub.emit(NotebookEvent.CLOSE_FILE, { id });
  }

  // Associate file id with the current tab
  // so the next time the file is opened this tab can be focused instead of opening a new tab
  registerFileMetadata(fileMetadata, isPreview) {
    const { glEventHub, metadata } = this.props;
    const { id: tabId } = metadata;
    glEventHub.emit(
      NotebookEvent.REGISTER_FILE,
      tabId,
      fileMetadata,
      isPreview
    );
  }

  renameTab(id, title) {
    const { glEventHub } = this.props;
    glEventHub.emit(NotebookEvent.RENAME, id, title);
  }

  setPreviewStatus() {
    if (!this.tabTitleElement) {
      return;
    }
    const { isPreview } = this.state;
    log.debug('setPreviewStatus', this.tabTitleElement, isPreview);
    if (isPreview) {
      this.tabTitleElement.classList.add('is-preview');
    } else {
      this.tabTitleElement.classList.remove('is-preview');
    }
  }

  getOverflowActions = memoize(() => [
    {
      title: 'Find',
      icon: dhFileSearch,
      action: this.handleFind,
      group: ContextActions.groups.high,
      shortcut: '⌃F',
      macShortcut: '⌘F',
      order: 10,
    },
  ]);

  savePanelState() {
    this.setState(state => {
      const {
        changeCount,
        savedChangeCount,
        fileMetadata,
        isPreview,
        settings: initialSettings,
      } = state;
      const value = this.getNotebookValue();
      // notebooks with no unsaved changes have value === null in dehydrated state
      // content will be loaded from file when hydrating
      const dehydratedValue = changeCount !== savedChangeCount ? value : null;
      const settings = {
        ...initialSettings,
        value,
      };
      const dehydratedSettings = {
        ...initialSettings,
        value: dehydratedValue,
      };
      const panelState = {
        settings: dehydratedSettings,
        fileMetadata,
        isPreview,
      };
      log.debug('Saving panel state', panelState);
      return {
        settings,
        // eslint-disable-next-line react/no-unused-state
        panelState,
      };
    });
  }

  handleFind() {
    if (this.notebook) {
      this.notebook.toggleFind();
    }
  }

  handleBlur() {
    log.debug('handleBlur');
    this.setState({ isFocused: false });
  }

  handleFocus() {
    log.debug('handleFocus');
    this.setState({ isFocused: true });
  }

  handleResize() {
    if (this.notebook) {
      this.notebook.updateDimensions();
    }
  }

  handleRunCommand(command) {
    this.runCommand(command);
  }

  handleRunAll() {
    if (!this.notebook) {
      log.error('Editor is not initialized.');
      return;
    }
    this.runCommand(this.notebook.getValue());
  }

  handleRunSelected() {
    if (!this.notebook) {
      log.error('Editor is not initialized.');
      return;
    }
    this.runCommand(this.notebook.getSelectedCommand());
  }

  handleSessionOpened(config, sessionLanguage, ide, console, session) {
    this.setState({
      session,
      sessionLanguage,
    });
  }

  handleSessionClosed() {
    this.setState({
      session: null,
      sessionLanguage: null,
    });
  }

  handleShow() {
    log.debug('handleShow');
    if (!this.notebook) {
      return;
    }
    this.notebook.updateDimensions();
    requestAnimationFrame(() => {
      this.notebook.focus();
    });
  }

  handleTab(tab) {
    log.debug('NotebookPanel tab event', tab);
    this.initTab(tab);
  }

  handleTabFocus() {
    log.debug('handleTabFocus');
    const { glContainer } = this.props;
    this.setState({
      isDashboardActive: true,
    });
    if (this.notebook && !glContainer.isHidden) {
      this.notebook.updateDimensions();
      this.notebook.focus();
    }
  }

  handleTabBlur() {
    log.debug('handleTabBlur');
    this.setState({
      isDashboardActive: false,
    });
  }

  runCommand(command) {
    if (!command) {
      log.debug('Ignoring empty command.');
      return;
    }
    const { glEventHub } = this.props;
    glEventHub.emit(ConsoleEvent.SEND_COMMAND, command, false, true);
  }

  render() {
    const {
      changeCount,
      savedChangeCount,
      error,
      isDashboardActive,
      isLoaded,
      isLoading,
      fileMetadata,
      session,
      sessionLanguage,
      settings: initialSettings,
    } = this.state;
    const {
      glContainer,
      glContainer: { tab },
      glEventHub,
    } = this.props;
    const itemName = fileMetadata?.itemName ?? NotebookPanel.DEFAULT_NAME;
    const isExistingItem = fileMetadata?.id != null;
    const overflowActions = this.getOverflowActions();
    const settings = {
      ...initialSettings,
    };
    const isSessionConnected = session != null;
    const isLanguageMatching = sessionLanguage === settings.language;
    const runButtonsDisabled =
      !isLoaded || !isSessionConnected || !isLanguageMatching;
    const toolbarDisabled = !isLoaded;
    const contextActions = [
      {
        action: this.handleSave,
        shortcut: '⌃S',
        macShortcut: '⌘S',
      },
    ];
    const disabledRunButtonTooltip = ScriptEditorUtils.getDisabledRunTooltip(
      isSessionConnected,
      isLanguageMatching,
      'Notebook extension',
      'Run'
    );
    const disabledRunSelectedButtonTooltip = ScriptEditorUtils.getDisabledRunTooltip(
      isSessionConnected,
      isLanguageMatching,
      'Notebook extension',
      'Run Selected'
    );

    const additionalActions = [
      {
        title: isExistingItem ? 'Rename' : 'Save As…',
        order: 10,
        group: ContextActions.groups.high,
        action: this.handleShowRename,
      },
      {
        title: 'Copy File',
        action: this.handleCopy,
        group: ContextActions.groups.high,
        order: 20,
      },
    ];

    return (
      <>
        {tab &&
          ReactDOM.createPortal(
            <span
              className={classNames('editor-unsaved-indicator', {
                'is-unsaved': changeCount !== savedChangeCount,
              })}
            />,
            tab.element.find('.lm_title_before').get(0) // tab.element is jquery element, we want a dom element
          )}

        <Panel
          className="notebook-container"
          componentPanel={this}
          glContainer={glContainer}
          glEventHub={glEventHub}
          onTab={this.handleTab}
          onResize={this.handleResize}
          onShow={this.handleShow}
          onTabFocus={this.handleTabFocus}
          onTabBlur={this.handleTabBlur}
          onSessionOpen={this.handleSessionOpened}
          onSessionClose={this.handleSessionClosed}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          additionalActions={additionalActions}
          renderTabTooltip={() => itemName}
        >
          <div className="notebook-toolbar">
            <span>
              <button
                type="button"
                className="btn btn-link btn-link-icon btn-play"
                onClick={this.handleRunAll}
                disabled={runButtonsDisabled}
              >
                <FontAwesomeIcon icon={vsRunAll} transform="grow-4" />
                <Tooltip>
                  Run {ContextActionUtils.getDisplayShortcutText('⌥R')}
                </Tooltip>
              </button>
              {disabledRunButtonTooltip && (
                <Tooltip>{disabledRunButtonTooltip}</Tooltip>
              )}
            </span>
            <span>
              <button
                type="button"
                className="btn btn-link btn-link-icon btn-play"
                onClick={this.handleRunSelected}
                disabled={runButtonsDisabled}
              >
                <FontAwesomeIcon icon={vsPlay} transform="grow-4" />
                <Tooltip>
                  Run Selected{' '}
                  {ContextActionUtils.getDisplayShortcutText('⇧⌥R')}
                </Tooltip>
              </button>
              {disabledRunSelectedButtonTooltip && (
                <Tooltip>{disabledRunSelectedButtonTooltip}</Tooltip>
              )}
            </span>
            <button
              type="button"
              className="btn btn-link btn-link-icon mr-auto"
              disabled={toolbarDisabled}
              onClick={this.handleSave}
            >
              <FontAwesomeIcon icon={vsSave} />
              <Tooltip>Save</Tooltip>
            </button>
            <button
              type="button"
              className="btn btn-link btn-overflow btn-link-icon"
              disabled={toolbarDisabled}
            >
              <FontAwesomeIcon icon={vsKebabVertical} />
              <Tooltip>More Actions...</Tooltip>
              <DropdownMenu
                actions={overflowActions}
                popperOptions={NotebookPanel.POPPER_OPTIONS}
              />
            </button>
          </div>
          <ScriptEditor
            isLoaded={isLoaded}
            isLoading={isLoading}
            error={error}
            onRunCommand={this.handleRunCommand}
            session={session}
            sessionLanguage={sessionLanguage}
            settings={settings}
            focusOnMount={isDashboardActive && !glContainer.isHidden}
            ref={notebook => {
              this.notebook = notebook;
            }}
          />
          <ContextActions actions={contextActions} />
        </Panel>
      </>
    );
  }
}

NotebookPanel.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  isDashboardActive: PropTypes.bool,
  isPreview: PropTypes.bool,
  metadata: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
  session: PropTypes.shape({}),
  sessionLanguage: PropTypes.string,
  panelState: PropTypes.shape({
    settings: PropTypes.shape({}),
    fileMetadata: PropTypes.shape({}),
  }).isRequired,
};

NotebookPanel.defaultProps = {
  isDashboardActive: true,
  isPreview: false,
  session: null,
  sessionLanguage: null,
};

export default NotebookPanel;
