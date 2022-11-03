// Wrapper for the Notebook for use in a golden layout container
import React, { Component, MouseEvent, ReactElement } from 'react';
import ReactDOM from 'react-dom';
import memoize from 'memoize-one';
import { connect } from 'react-redux';
import type { editor } from 'monaco-editor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  BasicModal,
  ContextActions,
  DropdownMenu,
  Tooltip,
  GLOBAL_SHORTCUTS,
  Button,
} from '@deephaven/components';
import { ScriptEditor, ScriptEditorUtils, SHORTCUTS } from '@deephaven/console';
import {
  FileStorage,
  FileUtils,
  NewItemModal,
  File,
} from '@deephaven/file-explorer';
import {
  vsSave,
  vsKebabVertical,
  dhFileSearch,
  vsPlay,
  dhRunSelection,
} from '@deephaven/icons';
import { getFileStorage, RootState } from '@deephaven/redux';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import Log from '@deephaven/log';
import { assertNotNull, Pending, PromiseUtils } from '@deephaven/utils';
import type { Container, EventEmitter, Tab } from '@deephaven/golden-layout';
import { IdeSession } from '@deephaven/jsapi-shim';
import { ConsoleEvent, NotebookEvent } from '../events';
import { getDashboardSessionWrapper } from '../redux';
import Panel from './Panel';
import MarkdownNotebook from './MarkdownNotebook';
import './NotebookPanel.scss';

const log = Log.module('NotebookPanel');

const DEBOUNCE_PANEL_STATE_UPDATE = 400;

interface Metadata {
  id: string;
}

interface Settings {
  language: string;
  value: string | null;
}

interface FileMetadata {
  itemName: string;
  id: string;
}

interface PanelState {
  isPreview?: boolean;
  settings: Settings;
  fileMetadata: FileMetadata | null;
}

interface NotebookPanelProps {
  fileStorage: FileStorage;
  glContainer: Container;
  glEventHub: EventEmitter;
  isDashboardActive: boolean;
  isPreview: boolean;
  metadata: Metadata;
  session: IdeSession;
  sessionLanguage: string;
  panelState: PanelState;
  notebooksUrl: string;
}

interface NotebookPanelState {
  error?: {
    message?: string | undefined;
  };
  isDashboardActive: boolean;
  isFocused: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  isPreview: boolean;

  savedChangeCount: number;
  changeCount: number;
  fileMetadata: FileMetadata | null;
  settings: Settings;

  session?: IdeSession;
  sessionLanguage?: string;

  // eslint-disable-next-line react/no-unused-state
  panelState: PanelState;

  showCloseModal: boolean;
  showSaveAsModal: boolean;

  scriptCode: string;

  itemName?: string;
}

class NotebookPanel extends Component<NotebookPanelProps, NotebookPanelState> {
  static COMPONENT = 'NotebookPanel';

  static POPPER_OPTIONS = { placement: 'bottom-end' } as const;

  static DEFAULT_NAME = 'Untitled';

  static handleError(error: unknown): void {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    log.error(error);
  }

  static defaultProps = {
    isDashboardActive: true,
    isPreview: false,
    session: null,
    sessionLanguage: null,
  };

  static languageFromFileName(fileName: string): string | null {
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

  constructor(props: NotebookPanelProps) {
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

    this.tabInitOnce = false;
    this.shouldPromptClose = true;

    const { isDashboardActive, session, sessionLanguage, panelState } = props;

    let settings: { value: string | null; language: string } = {
      value: '',
      language: '',
    };
    let fileMetadata = null;
    let { isPreview } = props;
    if (panelState != null) {
      ({
        fileMetadata = fileMetadata,
        isPreview = isPreview,
        settings = settings,
      } = panelState);
    }

    // Not showing the unsaved indicator for null file id and editor content === '',
    // may need to implement some other indication that this notebook has never been saved
    const hasFileId =
      fileMetadata != null && FileUtils.hasPath(fileMetadata.itemName);

    // Unsaved if file id != null and content != null
    // OR file id is null AND content is not null or ''
    const isUnsaved =
      (hasFileId === true && settings.value != null) ||
      (!hasFileId && settings.value != null && settings.value.length > 0);
    const changeCount = isUnsaved ? 1 : 0;

    this.state = {
      error: undefined,
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
    if (tab != null) this.initTab(tab);
    this.initNotebookContent();
    glEventHub.on(NotebookEvent.RENAME_FILE, this.handleRenameFile);
    glContainer.on('tabClicked', this.handlePanelTabClick);
  }

  componentDidUpdate(
    prevProps: NotebookPanelProps,
    prevState: NotebookPanelState
  ): void {
    const { isPreview } = this.state;
    if (isPreview !== prevState.isPreview) {
      this.setPreviewStatus();
    }
  }

  componentWillUnmount(): void {
    this.debouncedSavePanelState.flush();
    this.pending.cancel();

    const { glContainer, glEventHub } = this.props;

    const { fileMetadata, isPreview } = this.state;
    glEventHub.off(NotebookEvent.RENAME_FILE, this.handleRenameFile);
    glContainer.off('tabClicked', this.handlePanelTabClick);
    glEventHub.emit(NotebookEvent.UNREGISTER_FILE, fileMetadata, isPreview);
  }

  pending: Pending;

  debouncedSavePanelState;

  debouncedLoad;

  notebook: ScriptEditor | null;

  tabTitleElement: Element | null;

  tabInitOnce: boolean;

  shouldPromptClose: boolean;

  // Called by TabEvent. Happens once when created, but also each time its moved.
  // when moved, need to re-init the unsaved indicators on title elements
  initTab(tab: Tab): void {
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
      return true;
    };
  }

  initTabClasses(tab: Tab) {
    const tabElement = tab.element.get(0);
    assertNotNull(tabElement);
    const titleElement = tabElement.querySelector('.lm_title');
    this.tabTitleElement = titleElement;
    titleElement?.classList.add('notebook-title');
    this.setPreviewStatus();
  }

  getNotebookValue(): string | null {
    const { changeCount, savedChangeCount, settings } = this.state;
    const { value } = settings;
    if (changeCount !== savedChangeCount && this.notebook) {
      const notebookValue = this.notebook.getValue();
      return notebookValue != null ? notebookValue : value;
    }
    return value;
  }

  initNotebookContent(): void {
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

  closeFileTabById(id: string): void {
    const { glEventHub } = this.props;
    glEventHub.emit(NotebookEvent.CLOSE_FILE, { id });
  }

  // Associate file id with the current tab
  // so the next time the file is opened this tab can be focused instead of opening a new tab
  registerFileMetadata(fileMetadata: FileMetadata, isPreview: boolean): void {
    const { glEventHub, metadata } = this.props;
    const { id: tabId } = metadata;
    glEventHub.emit(
      NotebookEvent.REGISTER_FILE,
      tabId,
      fileMetadata,
      isPreview
    );
  }

  renameTab(id: string, title: string): void {
    const { glEventHub } = this.props;
    glEventHub.emit(NotebookEvent.RENAME, id, title);
  }

  load() {
    const { fileMetadata, settings } = this.state;
    assertNotNull(fileMetadata);
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
          language: NotebookPanel.languageFromFileName(itemName) ?? '',
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
   * @returns Returns true if save has begun, false if user needed to be prompted
   */
  save(): boolean {
    const { fileMetadata } = this.state;
    if (fileMetadata && FileUtils.hasPath(fileMetadata.itemName)) {
      const content = this.getNotebookValue();
      if (content != null) {
        this.saveContent(fileMetadata.itemName, content);
        return true;
      }
      return false;
    }

    this.setState({ showSaveAsModal: true });
    return false;
  }

  /**
   * Update existing file content
   * @param filename The name of the file
   * @param content New file content
   */
  saveContent(filename: string, content: string): void {
    log.debug('saveContent', filename, content);
    this.updateSavedChangeCount();
    const { fileStorage } = this.props;
    this.pending
      .add(fileStorage.saveFile({ filename, content, basename: filename }))
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

  handleCloseDiscard(): void {
    this.shouldPromptClose = false;
    this.setState({ showCloseModal: false });
    const { glContainer } = this.props;
    glContainer.close();
  }

  handleCloseSave(): void {
    this.shouldPromptClose = false;
    this.setState({ showCloseModal: false });
    if (this.save()) {
      const { glContainer } = this.props;
      glContainer.close();
    }
  }

  handleCloseCancel(): void {
    this.shouldPromptClose = true;
    this.setState({ showCloseModal: false });
  }

  handleCopy(): void {
    const { fileMetadata, settings } = this.state;
    assertNotNull(fileMetadata);
    const content = this.getNotebookValue();
    const { language } = settings;
    const { itemName } = fileMetadata;
    const copyName = FileUtils.getCopyFileName(itemName);
    log.debug('handleCopy', fileMetadata, itemName, copyName);
    this.createNotebook(copyName, language, content ?? undefined);
  }

  handleEditorChange(e: editor.IModelContentChangedEvent): void {
    log.debug2('handleEditorChanged', e);

    this.removePreviewStatus();

    this.setState(state => {
      const { changeCount, savedChangeCount } = state;
      const { isUndoing, isRedoing } = e;
      if (isUndoing) {
        // Note that it's possible to undo past where the user last saved, if they save and then undo for example
        return { changeCount: changeCount - 1, savedChangeCount };
      }

      if (!isRedoing && changeCount < savedChangeCount) {
        // We made another change after undoing some changes from the previous save
        // Just reset the saved counter to zero and increase the unchanged saves
        // It'll be set correctly on the next save
        return { changeCount: changeCount + 1, savedChangeCount: 0 };
      }

      return { changeCount: changeCount + 1, savedChangeCount };
    });
    this.debouncedSavePanelState();
  }

  handleFind() {
    if (this.notebook) {
      this.notebook.toggleFind();
    }
  }

  handleBlur(): void {
    log.debug('handleBlur');
    this.setState({ isFocused: false });
  }

  handleFocus(): void {
    log.debug('handleFocus');
    this.setState({ isFocused: true });
  }

  /**
   * @param event The click event from clicking on the link
   */
  handleLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    const { notebooksUrl, session, sessionLanguage } = this.props;
    const { href } = event.currentTarget;
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
      error: undefined,
      isLoaded: true,
      isLoading: false,
    });
  }

  handleLoadError(errorParam: { message?: string | undefined }) {
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

  handleSaveSuccess(file: File) {
    const { fileStorage } = this.props;
    const fileMetadata = { id: file.filename, itemName: file.filename };
    const language = NotebookPanel.languageFromFileName(file.filename) ?? '';
    this.setState(state => {
      const { fileMetadata: oldMetadata } = state;
      const settings = {
        ...state.settings,
        language,
      };
      log.debug('handleSaveSuccess', fileMetadata, oldMetadata, settings);
      if (
        oldMetadata &&
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

  handleSaveError(error: unknown) {
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

  handleSaveAsSubmit(name: string): void {
    log.debug('handleSaveAsSubmit', name);
    const { fileMetadata } = this.state;
    if (!fileMetadata) {
      return;
    }
    const { itemName: prevItemName } = fileMetadata;
    const content = this.getNotebookValue() ?? '';
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

  handleRenameFile(oldName: string, newName: string) {
    const { fileMetadata } = this.state;
    if (fileMetadata && fileMetadata.id === oldName) {
      this.setState({ fileMetadata: { id: newName, itemName: newName } });
      this.debouncedSavePanelState();
    }
  }

  handleResize(): void {
    this.notebook?.updateDimensions();
  }

  handleRunCommand(command?: string): void {
    this.runCommand(command);
  }

  handleRunAll(): void {
    if (!this.notebook) {
      log.error('Editor is not initialized.');
      return;
    }
    this.runCommand(this.notebook.getValue() ?? undefined);
  }

  handleRunSelected(): void {
    if (!this.notebook) {
      log.error('Editor is not initialized.');
      return;
    }
    this.runCommand(this.notebook.getSelectedCommand());
  }

  handleSessionOpened(
    session: IdeSession,
    { language }: { language: string }
  ): void {
    this.setState({
      session,
      sessionLanguage: language,
    });
  }

  handleSessionClosed(): void {
    this.setState({
      session: undefined,
      sessionLanguage: undefined,
    });
  }

  handleShow(): void {
    log.debug('handleShow');
    this.notebook?.updateDimensions();
  }

  handleShowRename(): void {
    this.setState({ showSaveAsModal: true });
  }

  handleTab(tab: Tab): void {
    log.debug('NotebookPanel tab event', tab);
    this.initTab(tab);
  }

  handleTabFocus(...args: unknown[]): void {
    log.debug('handleTabFocus', ...args);
    const { glContainer } = this.props;
    this.setState({
      isDashboardActive: true,
    });
    if (this.notebook && !glContainer.isHidden) {
      this.notebook.updateDimensions();
    }
  }

  handleTabBlur(): void {
    log.debug('handleTabBlur');
    this.setState({
      isDashboardActive: false,
    });
  }

  handlePanelTabClick(): void {
    log.debug('handlePanelTabClick');
    this.focus();
  }

  /**
   * Transform the link URI to load from where the notebook is if it's relative
   * @param src The link to transform
   * @returns String the transformed link
   */
  handleTransformLinkUri(src: string): string {
    const { notebooksUrl } = this.props;
    const { fileMetadata } = this.state;

    if (src.endsWith('/')) {
      return src;
    }

    if (src.startsWith('/')) {
      return `${notebooksUrl}${src.substring(1)}`;
    }

    let itemName = fileMetadata?.itemName;
    if (itemName === undefined) {
      return src;
    }
    if (itemName.charAt(0) === '/') {
      itemName = itemName.substring(1);
    }

    const itemUri = new URL(itemName, notebooksUrl);
    return new URL(src, itemUri).href;
  }

  focus(): void {
    requestAnimationFrame(() => {
      if (this.notebook) {
        this.notebook.focus();
      }
    });
  }

  createNotebook(
    itemName: string,
    language: string | undefined,
    content = ''
  ): void {
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

  runCommand(command?: string): void {
    if (command === undefined) {
      log.debug('Ignoring empty command.');
      return;
    }

    this.removePreviewStatus();

    const { glEventHub } = this.props;
    glEventHub.emit(ConsoleEvent.SEND_COMMAND, command, false, true);
  }

  removePreviewStatus(): void {
    this.setState(({ isPreview }) => {
      if (isPreview) {
        const { fileMetadata } = this.state;
        if (fileMetadata) {
          this.registerFileMetadata(fileMetadata, false);
        }
        return { isPreview: false };
      }
      return null;
    });
  }

  render(): ReactElement {
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

    const portal = tab?.element.find('.lm_title_before').get(0);

    return (
      <>
        {portal &&
          ReactDOM.createPortal(
            <span
              className={classNames('editor-unsaved-indicator', {
                'is-unsaved': changeCount !== savedChangeCount,
              })}
            />,
            portal // tab.element is jquery element, we want a dom element
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
                  <Button
                    kind="ghost"
                    className="btn-play"
                    onClick={this.handleRunAll}
                    disabled={runButtonsDisabled}
                    icon={<FontAwesomeIcon icon={vsPlay} transform="grow-4" />}
                    tooltip={`Run ${SHORTCUTS.NOTEBOOK.RUN.getDisplayText()}`}
                    aria-label="Run"
                  />
                  {disabledRunButtonTooltip != null && (
                    <Tooltip>{disabledRunButtonTooltip}</Tooltip>
                  )}
                </span>
                <span>
                  <Button
                    kind="ghost"
                    className="btn-play"
                    onClick={this.handleRunSelected}
                    disabled={runButtonsDisabled}
                    icon={
                      <FontAwesomeIcon
                        icon={dhRunSelection}
                        transform="grow-4"
                      />
                    }
                    tooltip={`Run Selected ${SHORTCUTS.NOTEBOOK.RUN_SELECTED.getDisplayText()}`}
                    aria-label="Run Selected"
                  />
                  {disabledRunSelectedButtonTooltip != null && (
                    <Tooltip>{disabledRunSelectedButtonTooltip}</Tooltip>
                  )}
                </span>
                <Button
                  kind="ghost"
                  className="mr-auto"
                  disabled={toolbarDisabled}
                  onClick={this.handleSave}
                  icon={vsSave}
                  tooltip={`Save ${GLOBAL_SHORTCUTS.SAVE.getDisplayText()}`}
                  aria-label="Save"
                />
                <Button
                  kind="ghost"
                  className="btn-overflow btn-link-icon"
                  disabled={toolbarDisabled}
                  icon={vsKebabVertical}
                  tooltip="More Actions..."
                >
                  <DropdownMenu
                    actions={overflowActions}
                    popperOptions={NotebookPanel.POPPER_OPTIONS}
                  />
                </Button>
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
              content={settings.value ?? ''}
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

const mapStateToProps = (
  state: RootState,
  ownProps: { localDashboardId: string }
) => {
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
