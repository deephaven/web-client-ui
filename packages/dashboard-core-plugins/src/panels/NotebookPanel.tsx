// Wrapper for the Notebook for use in a golden layout container
import React, { Component, ReactElement } from 'react';
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
  DropdownAction,
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
  vsCheck,
  vsCopy,
  dhICursor,
  vsTrash,
} from '@deephaven/icons';
import {
  getFileStorage,
  updateSettings as updateSettingsAction,
  RootState,
  WorkspaceSettings,
  getDefaultNotebookSettings,
} from '@deephaven/redux';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import {
  DashboardPanelProps,
  PanelEvent,
  PanelMetadata,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { assertNotNull, Pending, PromiseUtils } from '@deephaven/utils';
import type { Tab, CloseOptions } from '@deephaven/golden-layout';
import type { IdeSession } from '@deephaven/jsapi-types';
import { ConsoleEvent, NotebookEvent } from '../events';
import { getDashboardSessionWrapper } from '../redux';
import Panel from './Panel';
import MarkdownNotebook from './MarkdownNotebook';
import './NotebookPanel.scss';

const log = Log.module('NotebookPanel');

const DEBOUNCE_PANEL_STATE_UPDATE = 400;

interface Metadata extends PanelMetadata {
  id: string;
}
interface NotebookSetting {
  isMinimapEnabled: boolean;
}

interface FileMetadata {
  itemName: string;
  id: string;
}

interface PanelState {
  isPreview?: boolean;
  settings: editor.IStandaloneEditorConstructionOptions;
  fileMetadata: FileMetadata | null;
}

interface NotebookPanelProps extends DashboardPanelProps {
  fileStorage: FileStorage;
  isDashboardActive: boolean;
  isPreview: boolean;
  metadata: Metadata;
  session: IdeSession;
  sessionLanguage: string;
  panelState: PanelState;
  notebooksUrl: string;
  defaultNotebookSettings: NotebookSetting;
  updateSettings: (settings: Partial<WorkspaceSettings>) => void;
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
  settings: editor.IStandaloneEditorConstructionOptions;

  session?: IdeSession;
  sessionLanguage?: string;

  // eslint-disable-next-line react/no-unused-state
  panelState: PanelState;

  showCloseModal: boolean;
  showDeleteModal: boolean;
  showSaveAsModal: boolean;

  scriptCode: string;

  itemName?: string;
}

class NotebookPanel extends Component<NotebookPanelProps, NotebookPanelState> {
  static COMPONENT = 'NotebookPanel';

  static POPPER_OPTIONS = { placement: 'bottom-end' } as const;

  static DEFAULT_NAME = 'Untitled';

  static UNSAVED_INDICATOR_CLASS_NAME = 'editor-unsaved-indicator';

  static UNSAVED_STATUS_CLASS_NAME = 'is-unsaved';

  static handleError(error: unknown): void {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    log.error(error);
  }

  /**
   * Returns number of unsaved notebooks.
   */
  static unsavedNotebookCount(): number {
    return document.querySelectorAll(
      `.${NotebookPanel.UNSAVED_INDICATOR_CLASS_NAME}.${NotebookPanel.UNSAVED_STATUS_CLASS_NAME}`
    ).length;
  }

  static defaultProps = {
    isDashboardActive: true,
    isPreview: false,
    session: null,
    sessionLanguage: null,
    defaultNotebookSettings: { isMinimapEnabled: true },
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
    this.handleDelete = this.handleDelete.bind(this);
    this.handleDeleteConfirm = this.handleDeleteConfirm.bind(this);
    this.handleDeleteCancel = this.handleDeleteCancel.bind(this);
    this.handleEditorInitialized = this.handleEditorInitialized.bind(this);
    this.handleEditorWillDestroy = this.handleEditorWillDestroy.bind(this);
    this.handleEditorChange = this.handleEditorChange.bind(this);
    this.handleFind = this.handleFind.bind(this);
    this.handleMinimapChange = this.handleMinimapChange.bind(this);
    this.handleWordWrapChange = this.handleWordWrapChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
    this.handleLoadSuccess = this.handleLoadSuccess.bind(this);
    this.handleLoadError = this.handleLoadError.bind(this);
    this.handlePanelDropped = this.handlePanelDropped.bind(this);
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
    this.handleTabBlur = this.handleTabBlur.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleTabFocus = this.handleTabFocus.bind(this);
    this.handleTransformLinkUri = this.handleTransformLinkUri.bind(this);
    this.handleOverwrite = this.handleOverwrite.bind(this);
    this.handlePreviewPromotion = this.handlePreviewPromotion.bind(this);
    this.getDropdownOverflowActions =
      this.getDropdownOverflowActions.bind(this);
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

    const { isDashboardActive, session, sessionLanguage, panelState } = props;

    let settings: editor.IStandaloneEditorConstructionOptions = {
      value: '',
      language: '',
      wordWrap: 'off',
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
      showDeleteModal: false,
      showSaveAsModal: false,

      scriptCode: '',
    };

    log.debug('constructor', props, this.state);
  }

  componentDidMount(): void {
    const { glContainer, glEventHub } = this.props;
    const { tab } = glContainer;
    if (tab != null) this.initTab(tab);
    this.initNotebookContent();
    glEventHub.on(NotebookEvent.RENAME_FILE, this.handleRenameFile);
    glEventHub.on(PanelEvent.DROPPED, this.handlePanelDropped);
    glContainer.on(
      NotebookEvent.PROMOTE_FROM_PREVIEW,
      this.handlePreviewPromotion
    );
  }

  componentDidUpdate(
    prevProps: NotebookPanelProps,
    prevState: NotebookPanelState
  ): void {
    const { isPreview, settings } = this.state;
    const { wordWrap } = settings;
    const { defaultNotebookSettings } = this.props;
    if (isPreview !== prevState.isPreview) {
      this.setPreviewStatus();
    }
    if (wordWrap !== prevState.settings.wordWrap) {
      this.updateEditorWordWrap();
      this.debouncedSavePanelState();
    }
    if (
      defaultNotebookSettings.isMinimapEnabled !==
      prevProps.defaultNotebookSettings.isMinimapEnabled
    ) {
      this.updateEditorMinimap();
    }
  }

  componentWillUnmount(): void {
    this.debouncedSavePanelState.flush();
    this.pending.cancel();

    const { glEventHub, glContainer } = this.props;

    const { fileMetadata, isPreview } = this.state;
    glEventHub.off(NotebookEvent.RENAME_FILE, this.handleRenameFile);
    glEventHub.off(PanelEvent.DROPPED, this.handlePanelDropped);
    glContainer.off(
      NotebookEvent.PROMOTE_FROM_PREVIEW,
      this.handlePreviewPromotion
    );
    glEventHub.emit(NotebookEvent.UNREGISTER_FILE, fileMetadata, isPreview);
  }

  pending: Pending;

  debouncedSavePanelState;

  debouncedLoad;

  notebook: ScriptEditor | null;

  tabTitleElement: Element | null;

  tabInitOnce: boolean;

  editor?: editor.IStandaloneCodeEditor;

  // Called by TabEvent. Happens once when created, but also each time its moved.
  // when moved, need to re-init the unsaved indicators on title elements
  initTab(tab: Tab): void {
    if (!this.tabInitOnce) {
      this.tabInitOnce = true;
      this.initTabCloseOverride();
    }
    this.initTabClasses(tab);
  }

  /**
   * Adds a beforeClose handler to check if a notebook needs to be saved
   * Call panel close with force if the check can be skipped
   *
   * Note that firing a close event manually may trigger before state update occurs
   * In those instances, use force
   */
  initTabCloseOverride(): void {
    const { glContainer } = this.props;
    glContainer.beforeClose((options?: CloseOptions) => {
      if (options?.force === true) {
        return true;
      }

      const { changeCount, savedChangeCount } = this.state;
      if (changeCount !== savedChangeCount) {
        this.setState({ showCloseModal: true });
        return false;
      }

      return true;
    });
  }

  initTabClasses(tab: Tab): void {
    const tabElement = tab.element.get(0);
    assertNotNull(tabElement);
    const titleElement = tabElement.querySelector('.lm_title');
    this.tabTitleElement = titleElement;
    titleElement?.classList.add('notebook-title');
    this.setPreviewStatus();
  }

  getNotebookValue(): string | undefined {
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

  load(): void {
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
        if (settings.wordWrap === undefined) {
          settings.wordWrap = 'off';
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
      if (content !== undefined) {
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

  updateSavedChangeCount(): void {
    this.setState(({ changeCount }) => ({ savedChangeCount: changeCount }));
  }

  setPreviewStatus(): void {
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

  handlePreviewPromotion(): void {
    this.removePreviewStatus();
  }

  getSettings = memoize(
    (
      initialSettings: editor.IStandaloneEditorConstructionOptions,
      isMinimapEnabled: boolean
    ): editor.IStandaloneEditorConstructionOptions => ({
      ...initialSettings,
      minimap: { enabled: isMinimapEnabled },
    })
  );

  getOverflowActions = memoize(
    (isMinimapEnabled: boolean, isWordWrapEnabled: boolean) => [
      {
        title: 'Find',
        icon: dhFileSearch,
        action: this.handleFind,
        group: ContextActions.groups.high,
        shortcut: SHORTCUTS.NOTEBOOK.FIND,
        order: 10,
      },
      {
        title: 'Copy File',
        icon: vsCopy,
        action: this.handleCopy,
        group: ContextActions.groups.medium,
        order: 20,
      },
      {
        title: 'Rename File',
        icon: dhICursor,
        action: this.handleShowRename,
        group: ContextActions.groups.medium,
        order: 30,
      },
      {
        title: 'Delete File',
        icon: vsTrash,
        action: this.handleDelete,
        group: ContextActions.groups.medium,
        order: 40,
      },
      {
        title: 'Show Minimap',
        icon: isMinimapEnabled ? vsCheck : undefined,
        action: this.handleMinimapChange,
        group: ContextActions.groups.low,
        shortcut: SHORTCUTS.NOTEBOOK.MINIMAP,
        order: 20,
      },
      {
        title: 'Word Wrap',
        icon: isWordWrapEnabled ? vsCheck : undefined,
        action: this.handleWordWrapChange,
        group: ContextActions.groups.low,
        shortcut: SHORTCUTS.NOTEBOOK.WORDWRAP,
        order: 30,
      },
    ]
  );

  savePanelState(): void {
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
      const dehydratedValue =
        changeCount !== savedChangeCount ? value : undefined;
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
    this.setState({ showCloseModal: false });
    const { glContainer } = this.props;
    glContainer.close({ force: true });
  }

  handleCloseSave(): void {
    this.setState({ showCloseModal: false });
    if (this.save()) {
      const { glContainer } = this.props;
      glContainer.close({ force: true });
    }
  }

  handleCloseCancel(): void {
    this.setState({ showCloseModal: false });
  }

  /**
   * Closes overwritten tabs
   * @param fileName The name of the file to be overwritten
   */
  handleOverwrite(fileName: string): void {
    const { glEventHub } = this.props;

    glEventHub.emit(
      NotebookEvent.CLOSE_FILE,
      {
        id: fileName,
        itemName: fileName,
      },
      { force: true }
    );

    this.focus();
  }

  async handleCopy(): Promise<void> {
    const { fileStorage, glEventHub, session } = this.props;
    const { fileMetadata, settings } = this.state;
    assertNotNull(fileMetadata);
    const { language } = settings;
    const { itemName } = fileMetadata;
    const copyName = await FileUtils.getUniqueCopyFileName(
      fileStorage,
      itemName
    );
    log.debug('handleCopy', fileMetadata, itemName, copyName);
    await fileStorage.copyFile(itemName, copyName);
    const newFileMetadata = { id: copyName, itemName: copyName };
    const notebookSettings = {
      value: null,
      language,
    };
    glEventHub.emit(
      NotebookEvent.SELECT_NOTEBOOK,
      session,
      language,
      notebookSettings,
      newFileMetadata,
      true
    );
  }

  handleDelete(): void {
    log.debug('handleDelete, pending confirmation');
    this.setState({ showDeleteModal: true });
  }

  async handleDeleteConfirm(): Promise<void> {
    const { fileStorage, glContainer, glEventHub } = this.props;
    const { fileMetadata } = this.state;

    log.debug('handleDeleteConfirm', fileMetadata?.itemName);
    this.setState({ showDeleteModal: false });

    if (!fileMetadata) {
      return;
    }

    if (
      FileUtils.hasPath(fileMetadata.itemName) &&
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      (await FileUtils.fileExists(fileStorage, fileMetadata.itemName))
    ) {
      glEventHub.emit(NotebookEvent.CLOSE_FILE, fileMetadata, { force: true });
      fileStorage.deleteFile(fileMetadata.itemName);
    } else {
      glContainer.close({ force: true });
    }
  }

  handleDeleteCancel(): void {
    this.setState({ showDeleteModal: false });
  }

  handleEditorInitialized(innerEditor: editor.IStandaloneCodeEditor): void {
    this.editor = innerEditor;
  }

  handleEditorWillDestroy(): void {
    this.editor = undefined;
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

  handleFind(): void {
    if (this.notebook) {
      this.notebook.toggleFind();
    }
  }

  updateEditorMinimap(): void {
    if (this.editor) {
      const { defaultNotebookSettings } = this.props;
      this.editor.updateOptions({
        minimap: { enabled: defaultNotebookSettings.isMinimapEnabled },
      });
    }
  }

  handleMinimapChange(): void {
    const { defaultNotebookSettings, updateSettings } = this.props;
    const newSettings = {
      defaultNotebookSettings: {
        isMinimapEnabled: !defaultNotebookSettings.isMinimapEnabled,
      },
    };
    updateSettings(newSettings);
  }

  updateEditorWordWrap(): void {
    if (this.editor) {
      const { settings } = this.state;
      const { wordWrap } = settings;
      this.editor.updateOptions({
        wordWrap,
      });
    }
  }

  handleWordWrapChange(): void {
    if (this.editor) {
      this.setState(prevState => {
        const { settings } = prevState;
        const wordWrap = settings.wordWrap === 'on' ? 'off' : 'on';
        return {
          settings: {
            ...settings,
            wordWrap,
          },
        };
      });
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
  handleLinkClick(event: React.MouseEvent<HTMLAnchorElement>): void {
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

  handleLoadSuccess(): void {
    this.setState({
      error: undefined,
      isLoaded: true,
      isLoading: false,
    });
  }

  handleLoadError(errorParam: { message?: string | undefined }): void {
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

  handleSave(): void {
    log.debug('handleSave');
    this.save();
  }

  handleSaveSuccess(file: File): void {
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

  handleSaveError(error: unknown): void {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    // There was an error saving, just reset the savedChangeCount
    // It's possible if they undo changes they'll be back at the spot where it was last saved successfully,
    // But we may as well continue showing the error until they actually save again
    this.setState({ savedChangeCount: 0 });
    log.error(error);
  }

  handleSaveAsCancel(): void {
    this.setState({ showSaveAsModal: false });
  }

  handleSaveAsSubmit(name: string, isOverwrite = false): void {
    if (isOverwrite) {
      this.handleOverwrite(name);
    }

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

  handleRenameFile(
    oldName: string,
    newName: string,
    panelState?: PanelState
  ): void {
    const { fileMetadata, panelState: curPanelState } = this.state;
    const { glContainer } = this.props;

    if (
      fileMetadata?.itemName === `/${newName}` &&
      panelState &&
      JSON.stringify(curPanelState) !== JSON.stringify(panelState)
    ) {
      glContainer.close();
      return;
    }

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

  handlePanelDropped(droppedId: string): void {
    const {
      metadata: { id },
    } = this.props;
    // re-render necessary for portal after being dropped
    if (droppedId === id) this.forceUpdate();
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

  handleTabClick(e: MouseEvent): void {
    log.debug('handle NotebookPanel tab click');
    this.focus();
    if (e.detail === 2) {
      this.removePreviewStatus();
    }
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
    if (command === undefined || command === '') {
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

  getDropdownOverflowActions(): DropdownAction[] {
    const { defaultNotebookSettings } = this.props;
    const { settings: initialSettings } = this.state;
    return this.getOverflowActions(
      defaultNotebookSettings.isMinimapEnabled,
      this.getSettings(
        initialSettings,
        defaultNotebookSettings.isMinimapEnabled
      ).wordWrap === 'on'
    );
  }

  render(): ReactElement {
    const {
      fileStorage,
      glContainer,
      glContainer: { tab },
      glEventHub,
      defaultNotebookSettings,
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
      showDeleteModal,
      showSaveAsModal,
    } = this.state;
    // We don't want to steal focus if this isn't shown or it's just a preview
    const focusOnMount =
      isDashboardActive && !glContainer.isHidden && !isPreview;
    const itemName = fileMetadata?.itemName ?? NotebookPanel.DEFAULT_NAME;
    const isMarkdown = itemName.endsWith('.md');
    const isExistingItem = fileMetadata?.id != null;
    const settings = this.getSettings(
      initialSettings,
      defaultNotebookSettings.isMinimapEnabled
    );
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
      {
        action: this.handleMinimapChange,
        shortcut: SHORTCUTS.NOTEBOOK.MINIMAP,
      },
      {
        action: this.handleWordWrapChange,
        shortcut: SHORTCUTS.NOTEBOOK.WORDWRAP,
      },
    ];
    const disabledRunButtonTooltip = ScriptEditorUtils.getDisabledRunTooltip(
      isSessionConnected,
      isLanguageMatching,
      'Notebook extension',
      'Run'
    );
    const disabledRunSelectedButtonTooltip =
      ScriptEditorUtils.getDisabledRunTooltip(
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
        {portal != null &&
          ReactDOM.createPortal(
            <span
              className={classNames(
                NotebookPanel.UNSAVED_INDICATOR_CLASS_NAME,
                {
                  [NotebookPanel.UNSAVED_STATUS_CLASS_NAME]:
                    changeCount !== savedChangeCount,
                }
              )}
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
          onTabClicked={this.handleTabClick}
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
                  className="btn-overflow"
                  disabled={toolbarDisabled}
                  icon={vsKebabVertical}
                  tooltip="More Actions..."
                  onClick={() => {
                    // no-op: click is handled in `DropdownMenu`
                  }}
                >
                  <DropdownMenu
                    actions={this.getDropdownOverflowActions}
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
                onEditorInitialized={this.handleEditorInitialized}
                onEditorWillDestroy={this.handleEditorWillDestroy}
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
            isOpen={showDeleteModal}
            headerText={`Are you sure you want to delete "${itemName}"?`}
            bodyText="You cannot undo this action."
            onCancel={this.handleDeleteCancel}
            onConfirm={this.handleDeleteConfirm}
            confirmButtonText="Delete"
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
): Pick<
  NotebookPanelProps,
  'defaultNotebookSettings' | 'fileStorage' | 'session' | 'sessionLanguage'
> => {
  const fileStorage = getFileStorage(state);
  const defaultNotebookSettings = getDefaultNotebookSettings(state);
  const sessionWrapper = getDashboardSessionWrapper(
    state,
    ownProps.localDashboardId
  );

  const { session, config: sessionConfig } = sessionWrapper ?? {};
  const { type: sessionLanguage } = sessionConfig ?? {};
  return {
    fileStorage,
    defaultNotebookSettings: defaultNotebookSettings as NotebookSetting,
    session,
    sessionLanguage,
  };
};

const ConnectedNotebookPanel = connect(
  mapStateToProps,
  { updateSettings: updateSettingsAction },
  null,
  { forwardRef: true }
)(NotebookPanel);

export default ConnectedNotebookPanel;
