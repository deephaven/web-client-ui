// Wrapper for the Notebook for use in a golden layout container
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import memoize from 'memoize-one';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  BasicModal,
  ContextActions,
  DropdownMenu,
  Tooltip,
  GLOBAL_SHORTCUTS,
} from '@deephaven/components';
import { ScriptEditor, ScriptEditorUtils, SHORTCUTS } from '@deephaven/console';
import { GLPropTypes } from '@deephaven/dashboard';
import { FileUtils, NewItemModal } from '@deephaven/file-explorer';
import {
  vsSave,
  vsKebabVertical,
  dhFileSearch,
  vsPlay,
  vsRunAll,
} from '@deephaven/icons';
import { getFileStorage } from '@deephaven/redux';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import Log from '@deephaven/log';
import { Pending, PromiseUtils } from '@deephaven/utils';
import { ConsoleEvent, NotebookEvent } from '../events';
import { getDashboardSessionWrapper } from '../redux';
import Panel from './Panel';
import MarkdownNotebook from './MarkdownNotebook';
import './NotebookPanel.scss';

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

  static languageFromFileName(fileName) {
    const extension = FileUtils.getExtension(fileName).toLowerCase();
    switch (extension) {
      case 'py':
      case 'python':
        return 'python';
      case 'groovy':
        return 'groovy';
      case 'scala':
        return 'scala';
      default:
        return null;
    }
  }

  constructor(props) {
    super(props);

    this.handleBlur = this.handleBlur.bind(this);
    this.handleCloseCancel = this.handleCloseCancel.bind(this);
    this.handleCloseDiscard = this.handleCloseDiscard.bind(this);
    this.handleCloseSave = this.handleCloseSave.bind(this);
    this.handleCopy = this.handleCopy.bind(this);
    this.handleEditorChange = this.handleEditorChange.bind(this);
    this.handleFind = this.handleFind.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
    this.handleLoadSuccess = this.handleLoadSuccess.bind(this);
    this.handleLoadError = this.handleLoadError.bind(this);
    this.handlePanelTabClick = this.handlePanelTabClick.bind(this);
    this.handleRenameFile = this.handleRenameFile.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleRunCommand = this.handleRunCommand.bind(this);
    this.handleRunAll = this.handleRunAll.bind(this);
    this.handleRunSelected = this.handleRunSelected.bind(this);
    this.handleSave = this.handleSave.bind(this);
    this.handleSaveAsCancel = this.handleSaveAsCancel.bind(this);
    this.handleSaveAsSubmit = this.handleSaveAsSubmit.bind(this);
    this.handleSaveError = this.handleSaveError.bind(this);
    this.handleSaveSuccess = this.handleSaveSuccess.bind(this);
    this.handleSessionOpened = this.handleSessionOpened.bind(this);
    this.handleSessionClosed = this.handleSessionClosed.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handleShowRename = this.handleShowRename.bind(this);
    this.handleTab = this.handleTab.bind(this);
    this.handleTabFocus = this.handleTabFocus.bind(this);
    this.handleTabBlur = this.handleTabBlur.bind(this);
    this.handleTransformLinkUri = this.handleTransformLinkUri.bind(this);

    this.pending = new Pending();

    this.debouncedSavePanelState = debounce(
      this.savePanelState.bind(this),
      DEBOUNCE_PANEL_STATE_UPDATE
    );

    this.debouncedLoad = debounce(
      this.load.bind(this),
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
    const hasFileId =
      fileMetadata.itemName && FileUtils.hasPath(fileMetadata.itemName);

    // Unsaved if file id != null and content != null
    // OR file id is null AND content is not null or ''
    const isUnsaved =
      (hasFileId && settings.value != null) || (!hasFileId && settings.value);
    const changeCount = isUnsaved ? 1 : 0;

    this.state = {
      error: null,
      isDashboardActive,
      isFocused: false,
      isLoading: true,
      isLoaded: false,
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

      showCloseModal: false,
      showSaveAsModal: false,

      scriptCode: '',
    };

    log.debug('constructor', props, this.state);
  }

  componentDidMount() {
    const { glContainer, glEventHub } = this.props;
    const { tab } = glContainer;
    if (tab) this.initTab(tab);
    this.initNotebookContent();
    glEventHub.on(NotebookEvent.RENAME_FILE, this.handleRenameFile);
    glContainer.on('tabClicked', this.handlePanelTabClick);
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

    const { glContainer, glEventHub } = this.props;

    const { fileMetadata, isPreview } = this.state;
    glEventHub.off(NotebookEvent.RENAME_FILE, this.handleRenameFile);
    glContainer.off('tabClicked', this.handlePanelTabClick);
    glEventHub.emit(NotebookEvent.UNREGISTER_FILE, fileMetadata, isPreview);
  }

  // Called by TabEvent. Happens once when created, but also each time its moved.
  // when moved, need to re-init the unsaved indicators on title elements
  initTab(tab) {
    if (!this.tabInitOnce) {
      this.tabInitOnce = true;
      this.initTabCloseOverride();
    }
    this.initTabClasses(tab);
  }

  // override glContainer.close() with a custom closure that checks if needs saving
  initTabCloseOverride() {
    const { glContainer } = this.props;
    const close = glContainer.close.bind(glContainer);
    glContainer.close = () => {
      const { changeCount, savedChangeCount } = this.state;
      if (changeCount !== savedChangeCount && this.shouldPromptClose) {
        this.setState({ showCloseModal: true });
      } else {
        close();
      }
    };
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
      this.load();
      return;
    }
    if (settings.value != null) {
      log.debug('Use content passed in the settings prop');
      this.handleLoadSuccess();
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

  load() {
    const { fileMetadata, settings } = this.state;
    const { id } = fileMetadata;
    const { fileStorage } = this.props;
    this.pending
      .add(fileStorage.loadFile(id))
      .then(loadedFile => {
        log.debug('Loaded file', loadedFile);
        const { filename: itemName } = loadedFile;
        const { itemName: prevItemName } = this.state;
        if (itemName !== prevItemName) {
          const { metadata } = this.props;
          const { id: tabId } = metadata;
          this.renameTab(tabId, FileUtils.getBaseName(itemName));
        }
        const updatedSettings = {
          ...settings,
          language: NotebookPanel.languageFromFileName(itemName),
        };
        if (settings.value == null) {
          updatedSettings.value = loadedFile.content;
        }
        this.setState({
          fileMetadata: { id: itemName, itemName },
          settings: updatedSettings,
        });
        this.debouncedSavePanelState();
      })
      .then(this.handleLoadSuccess)
      .catch(this.handleLoadError);
  }

  /**
   * Attempts to save the notebook.
   * @returns {boolean} Returns true if save has begun, false if user needed to be prompted
   */
  save() {
    const { fileMetadata } = this.state;
    if (fileMetadata && FileUtils.hasPath(fileMetadata.itemName)) {
      const content = this.getNotebookValue();
      this.saveContent(fileMetadata.itemName, content);
      return true;
    }

    this.setState({ showSaveAsModal: true });
    return false;
  }

  /**
   * Update existing file content
   * @param {string} filename The name of the file
   * @param {string} content New file content
   */
  saveContent(filename, content) {
    log.debug('saveContent', filename, content);
    this.updateSavedChangeCount();
    const { fileStorage } = this.props;
    this.pending
      .add(fileStorage.saveFile({ filename, content }))
      .then(this.handleSaveSuccess)
      .catch(this.handleSaveError);
  }

  updateSavedChangeCount() {
    this.setState(({ changeCount }) => ({ savedChangeCount: changeCount }));
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
      shortcut: SHORTCUTS.NOTEBOOK.FIND,
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

  handleCloseDiscard() {
    this.shouldPromptClose = false;
    this.setState({ showCloseModal: false });
    const { glContainer } = this.props;
    glContainer.close();
  }

  handleCloseSave() {
    this.shouldPromptClose = false;
    this.setState({ showCloseModal: false });
    if (this.save()) {
      const { glContainer } = this.props;
      glContainer.close();
    }
  }

  handleCloseCancel() {
    this.shouldPromptClose = true;
    this.setState({ showCloseModal: false });
  }

  handleCopy() {
    const { fileMetadata, settings } = this.state;
    const content = this.getNotebookValue();
    const { language } = settings;
    const { itemName } = fileMetadata;
    const copyName = FileUtils.getCopyFileName(itemName);
    log.debug('handleCopy', fileMetadata, itemName, copyName);
    this.createNotebook(copyName, language, content);
  }

  handleEditorChange(e) {
    log.debug2('handleEditorChanged', e);

    this.removePreviewStatus();

    this.setState(({ changeCount, savedChangeCount }) => {
      const { isUndoing, isRedoing } = e;
      if (isUndoing) {
        // Note that it's possible to undo past where the user last saved, if they save and then undo for example
        return { changeCount: changeCount - 1 };
      }

      if (!isRedoing && changeCount < savedChangeCount) {
        // We made another change after undoing some changes from the previous save
        // Just reset the saved counter to zero and increase the unchanged saves
        // It'll be set correctly on the next save
        return { changeCount: changeCount + 1, savedChangeCount: 0 };
      }

      return { changeCount: changeCount + 1 };
    });
    this.debouncedSavePanelState();
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

  /**
   * @param {MouseEvent} event The click event from clicking on the link
   */
  handleLinkClick(event) {
    const { notebooksUrl, session, sessionLanguage } = this.props;
    const { href } = event.target;
    if (!href || !href.startsWith(notebooksUrl)) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const notebookPath = `/${href.substring(notebooksUrl.length)}`.replace(
      /%20/g,
      ' '
    );
    if (notebookPath === '/') {
      log.debug('Ignoring invalid notebook link', notebookPath);
      return;
    }

    log.debug('Notebook link clicked, opening', notebookPath);

    const { glEventHub } = this.props;
    const notebookSettings = {
      value: null,
      language: sessionLanguage,
    };
    const fileMetadata = { id: notebookPath, itemName: notebookPath };
    glEventHub.emit(
      NotebookEvent.SELECT_NOTEBOOK,
      session,
      sessionLanguage,
      notebookSettings,
      fileMetadata
    );
  }

  handleLoadSuccess() {
    this.setState({
      error: null,
      isLoaded: true,
      isLoading: false,
    });
  }

  handleLoadError(errorParam) {
    let error = errorParam;
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    if (PromiseUtils.isTimedOut(error)) {
      error = new Error('File not found.');
    }
    log.error(error);
    this.setState({ error, isLoading: false });
  }

  handleSave() {
    log.debug('handleSave');
    this.save();
  }

  handleSaveSuccess(file) {
    const { fileStorage } = this.props;
    const fileMetadata = { id: file.filename, itemName: file.filename };
    const language = NotebookPanel.languageFromFileName(file.filename);
    this.setState(state => {
      const { fileMetadata: oldMetadata } = state;
      const settings = {
        ...state.settings,
        language,
      };
      log.debug('handleSaveSuccess', fileMetadata, oldMetadata, settings);
      if (
        FileUtils.hasPath(oldMetadata.itemName) &&
        oldMetadata.itemName !== fileMetadata.itemName
      ) {
        log.debug('handleSaveSuccess deleting old file', oldMetadata.itemName);
        fileStorage
          .deleteFile(oldMetadata.itemName)
          .catch(NotebookPanel.handleError);
      }
      return {
        fileMetadata,
        settings,
        isPreview: false,
      };
    });
    this.debouncedSavePanelState();
    this.registerFileMetadata(fileMetadata, false);
  }

  handleSaveError(error) {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    // There was an error saving, just reset the savedChangeCount
    // It's possible if they undo changes they'll be back at the spot where it was last saved successfully,
    // But we may as well continue showing the error until they actually save again
    this.setState({ savedChangeCount: 0 });
    log.error(error);
  }

  handleSaveAsCancel() {
    this.setState({ showSaveAsModal: false });
  }

  handleSaveAsSubmit(name) {
    log.debug('handleSaveAsSubmit', name);
    const { fileMetadata } = this.state;
    const { itemName: prevItemName } = fileMetadata;
    const content = this.getNotebookValue();
    this.setState({
      showSaveAsModal: false,
    });

    if (FileUtils.getBaseName(prevItemName) !== FileUtils.getBaseName(name)) {
      const { metadata } = this.props;
      const { id: tabId } = metadata;
      this.renameTab(tabId, FileUtils.getBaseName(name));
    }

    this.saveContent(name, content);
  }

  handleRenameFile(oldName, newName) {
    const { fileMetadata } = this.state;
    if (fileMetadata.id === oldName) {
      this.setState({ fileMetadata: { id: newName, itemName: newName } });
      this.debouncedSavePanelState();
    }
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

  handleSessionOpened(session, { language }) {
    this.setState({
      session,
      sessionLanguage: language,
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
    if (this.notebook) {
      this.notebook.updateDimensions();
    }
  }

  handleShowRename() {
    this.setState({ showSaveAsModal: true });
  }

  handleTab(tab) {
    log.debug('NotebookPanel tab event', tab);
    this.initTab(tab);
  }

  handleTabFocus(...args) {
    log.debug('handleTabFocus', ...args);
    const { glContainer } = this.props;
    this.setState({
      isDashboardActive: true,
    });
    if (this.notebook && !glContainer.isHidden) {
      this.notebook.updateDimensions();
    }
  }

  handleTabBlur() {
    log.debug('handleTabBlur');
    this.setState({
      isDashboardActive: false,
    });
  }

  handlePanelTabClick() {
    log.debug('handlePanelTabClick');
    this.focus();
  }

  /**
   * Transform the link URI to load from where the notebook is if it's relative
   * @param {String} src The link to transform
   * @returns String the transformed link
   */
  handleTransformLinkUri(src) {
    const { notebooksUrl } = this.props;
    const { fileMetadata } = this.state;

    if (src.charAt(0) === '/') {
      return `${notebooksUrl}${src}`;
    }

    let itemName = fileMetadata?.itemName;
    if (!itemName) {
      return src;
    }
    if (itemName.charAt(0) === '/') {
      itemName = itemName.substring(1);
    }

    const itemUri = new URL(itemName, notebooksUrl);
    return new URL(src, itemUri).href;
  }

  focus() {
    requestAnimationFrame(() => {
      if (this.notebook) {
        this.notebook.focus();
      }
    });
  }

  createNotebook(itemName, language, content) {
    const { glEventHub } = this.props;
    const { session, sessionLanguage, settings } = this.state;
    const notebookSettings = {
      ...settings,
      language,
      value: content,
    };
    const fileMetadata = {
      id: null,
      itemName,
    };
    log.debug(
      'handleCreateNotebook',
      session,
      sessionLanguage,
      notebookSettings,
      fileMetadata
    );
    glEventHub.emit(
      NotebookEvent.CREATE_NOTEBOOK,
      session,
      sessionLanguage,
      notebookSettings,
      fileMetadata
    );
  }

  runCommand(command) {
    if (!command) {
      log.debug('Ignoring empty command.');
      return;
    }

    this.removePreviewStatus();

    const { glEventHub } = this.props;
    glEventHub.emit(ConsoleEvent.SEND_COMMAND, command, false, true);
  }

  removePreviewStatus() {
    this.setState(({ isPreview }) => {
      if (isPreview) {
        const { fileMetadata } = this.state;
        this.registerFileMetadata(fileMetadata, false);
        return { isPreview: false };
      }
      return null;
    });
  }

  render() {
    const {
      fileStorage,
      glContainer,
      glContainer: { tab },
      glEventHub,
    } = this.props;
    const {
      changeCount,
      savedChangeCount,
      error,
      isDashboardActive,
      isLoaded,
      isLoading,
      isPreview,
      fileMetadata,
      session,
      sessionLanguage,
      settings: initialSettings,
      showCloseModal,
      showSaveAsModal,
    } = this.state;
    // We don't want to steal focus if this isn't shown or it's just a preview
    const focusOnMount =
      isDashboardActive && !glContainer.isHidden && !isPreview;
    const itemName = fileMetadata?.itemName ?? NotebookPanel.DEFAULT_NAME;
    const isMarkdown = itemName.endsWith('.md');
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
        shortcut: GLOBAL_SHORTCUTS.SAVE,
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
          {!isMarkdown && (
            <>
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
                      Run {SHORTCUTS.NOTEBOOK.RUN.getDisplayText()}
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
                      {SHORTCUTS.NOTEBOOK.RUN_SELECTED.getDisplayText()}
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
                onChange={this.handleEditorChange}
                onRunCommand={this.handleRunCommand}
                session={session}
                sessionLanguage={sessionLanguage}
                settings={settings}
                focusOnMount={focusOnMount}
                ref={notebook => {
                  this.notebook = notebook;
                }}
              />
            </>
          )}
          {isMarkdown && (
            <MarkdownNotebook
              content={settings.value}
              onLinkClick={this.handleLinkClick}
              onRunCode={this.handleRunCommand}
              transformImageUri={this.handleTransformLinkUri}
              transformLinkUri={this.handleTransformLinkUri}
            />
          )}
          <NewItemModal
            isOpen={showSaveAsModal}
            type="file"
            defaultValue={itemName}
            title={isExistingItem ? 'Rename' : 'Save file as'}
            onSubmit={this.handleSaveAsSubmit}
            onCancel={this.handleSaveAsCancel}
            notifyOnExtensionChange
            storage={fileStorage}
          />
          <BasicModal
            isOpen={showCloseModal}
            headerText={`Do you want to save the changes you made to ${itemName}?`}
            bodyText="Your changes will be lost if you don't save them."
            onCancel={this.handleCloseCancel}
            onDiscard={this.handleCloseDiscard}
            onConfirm={this.handleCloseSave}
            discardButtonText="Discard Changes"
            confirmButtonText="Save"
          />
          <ContextActions actions={contextActions} />
        </Panel>
      </>
    );
  }
}

NotebookPanel.propTypes = {
  fileStorage: PropTypes.shape({
    deleteFile: PropTypes.func.isRequired,
    loadFile: PropTypes.func.isRequired,
    saveFile: PropTypes.func.isRequired,
  }).isRequired,
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
  notebooksUrl: PropTypes.string,
};

NotebookPanel.defaultProps = {
  isDashboardActive: true,
  isPreview: false,
  session: null,
  sessionLanguage: null,
  notebooksUrl: new URL(
    `${process.env.REACT_APP_NOTEBOOKS_URL}/`,
    window.location
  ).href,
};

const mapStateToProps = (state, ownProps) => {
  const fileStorage = getFileStorage(state);
  const sessionWrapper = getDashboardSessionWrapper(
    state,
    ownProps.localDashboardId
  );
  const { session, config: sessionConfig } = sessionWrapper ?? {};
  const { type: sessionLanguage } = sessionConfig ?? {};
  return {
    fileStorage,
    session,
    sessionLanguage,
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  NotebookPanel
);
