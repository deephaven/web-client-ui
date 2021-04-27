import shortid from 'shortid';
import Log from '@deephaven/log';
import LayoutUtils from '../../layout/LayoutUtils';
import { NotebookEvent } from '../events';
import { NotebookPanel } from '../panels';

const log = Log.module('NotebookEventHandler');

class NotebookEventHandler {
  constructor(layout, panelManager) {
    this.createNotebook = this.createNotebook.bind(this);
    this.selectNotebook = this.selectNotebook.bind(this);
    this.sendToNotebook = this.sendToNotebook.bind(this);
    this.closeFileTab = this.closeFileTab.bind(this);
    this.registerFileTab = this.registerFileTab.bind(this);
    this.renameTab = this.renameTab.bind(this);
    this.renameFileTab = this.renameFileTab.bind(this);
    this.unregisterFileTab = this.unregisterFileTab.bind(this);

    this.layout = layout;
    this.panelManager = panelManager;
    this.notebookIndex = 0;
    // Map of tab ids by file id
    this.openFileMap = new Map();
    this.previewFileMap = new Map();

    this.startListening();
  }

  startListening() {
    this.layout.eventHub.on(NotebookEvent.CLOSE_FILE, this.closeFileTab);
    this.layout.eventHub.on(NotebookEvent.CREATE_NOTEBOOK, this.createNotebook);
    this.layout.eventHub.on(NotebookEvent.SELECT_NOTEBOOK, this.selectNotebook);
    this.layout.eventHub.on(NotebookEvent.RENAME, this.renameTab);
    this.layout.eventHub.on(NotebookEvent.RENAME_FILE, this.renameFileTab);
    this.layout.eventHub.on(
      NotebookEvent.SEND_TO_NOTEBOOK,
      this.sendToNotebook
    );
    this.layout.eventHub.on(NotebookEvent.REGISTER_FILE, this.registerFileTab);
    this.layout.eventHub.on(
      NotebookEvent.UNREGISTER_FILE,
      this.unregisterFileTab
    );
  }

  stopListening() {
    this.layout.eventHub.off(NotebookEvent.CLOSE_FILE, this.closeFileTab);
    this.layout.eventHub.off(
      NotebookEvent.CREATE_NOTEBOOK,
      this.createNotebook
    );
    this.layout.eventHub.off(
      NotebookEvent.SELECT_NOTEBOOK,
      this.selectNotebook
    );
    this.layout.eventHub.off(NotebookEvent.RENAME, this.renameTab);
    this.layout.eventHub.off(NotebookEvent.RENAME_FILE, this.renameFileTab);
    this.layout.eventHub.off(
      NotebookEvent.SEND_TO_NOTEBOOK,
      this.sendToNotebook
    );
    this.layout.eventHub.off(NotebookEvent.REGISTER_FILE, this.registerFileTab);
    this.layout.eventHub.off(
      NotebookEvent.UNREGISTER_FILE,
      this.unregisterFileTab
    );
  }

  // eslint-disable-next-line class-methods-use-this
  getNotebookTitle(fileMetadata) {
    const { itemName } = fileMetadata;
    return itemName;
  }

  getNotebookFileName({ language }) {
    const extension = language === 'python' ? 'py' : language;
    let title = null;
    if (!extension) {
      log.debug('No extension for language', language);
      title = `Untitled-${this.notebookIndex}`;
    } else {
      title = `Untitled-${this.notebookIndex}.${extension}`;
    }
    this.notebookIndex += 1;
    return title;
  }

  getTabIdForFileMetadata(fileMetadata, createIfNecessary = true) {
    const { id: fileId } = fileMetadata;
    if (fileId && this.openFileMap.has(fileId)) {
      return this.openFileMap.get(fileId);
    }
    if (fileId && this.previewFileMap.has(fileId)) {
      return this.previewFileMap.get(fileId);
    }
    if (createIfNecessary) {
      return shortid.generate();
    }
    return null;
  }

  makeConfig({
    id,
    settings,
    fileMetadata,
    session,
    sessionLanguage,
    isPreview = false,
  }) {
    const panelState = {
      settings,
      fileMetadata,
    };
    const title = this.getNotebookTitle(fileMetadata);
    return {
      type: 'react-component',
      component: NotebookPanel.COMPONENT,
      props: {
        metadata: { id },
        session,
        sessionLanguage,
        panelState,
        isPreview,
      },
      title,
      id,
    };
  }

  /** Starts a new notebook and opens it */
  createNotebook(
    session,
    sessionLanguage,
    settings,
    fileMetadata = {
      id: null,
      itemName: this.getNotebookFileName(settings),
    }
  ) {
    const id = this.getTabIdForFileMetadata(fileMetadata);
    if (this.fileIsOpen(fileMetadata)) {
      log.debug('File is already open, focus tab');
      LayoutUtils.activateTab(this.layout.root, { id });
      return;
    }
    const stack = LayoutUtils.getStackForComponentTypes(this.layout.root, [
      NotebookPanel.COMPONENT,
    ]);
    const config = this.makeConfig({
      id,
      settings,
      fileMetadata,
      session,
      sessionLanguage,
    });
    log.debug('createNotebook', config, ...this.openFileMap);
    LayoutUtils.openComponentInStack(stack, config);
  }

  selectNotebook(session, sessionLanguage, settings, fileMetadata) {
    log.debug('selectNotebook', fileMetadata);
    let previewTabId = null;
    let isPreview = true;
    const isFileOpen = this.fileIsOpen(fileMetadata);
    const isFileOpenAsPreview = this.fileIsOpenAsPreview(fileMetadata);

    if (!isFileOpen && !isFileOpenAsPreview) {
      log.debug('selectNotebook, file not open');
      if (this.previewFileMap.size > 0) {
        log.debug('selectNotebook, file not open, previewFileMap not empty');
        // Existing preview tab id to reuse
        [previewTabId] = this.previewFileMap.values();
      }
    } else {
      // File already open in background
      if (!this.fileIsActive(fileMetadata)) {
        this.activateFileTab(fileMetadata);
        return;
      }
      // File already open in foreground, not in preview mode
      if (!isFileOpenAsPreview) {
        this.activateFileTab(fileMetadata);
        return;
      }
      // File already open in foreground in preview mode
      [previewTabId] = this.previewFileMap.values();
      isPreview = false;
    }
    let id = null;
    let stack = null;
    if (previewTabId != null) {
      id = previewTabId;
      stack = LayoutUtils.getStackForConfig(this.layout.root, {
        component: NotebookPanel.COMPONENT,
        id,
      });
    }
    if (stack == null) {
      id = this.getTabIdForFileMetadata(fileMetadata);
      stack = LayoutUtils.getStackForComponentTypes(this.layout.root, [
        NotebookPanel.COMPONENT,
      ]);
    }
    const config = this.makeConfig({
      id,
      settings,
      fileMetadata,
      session,
      sessionLanguage,
      isPreview,
    });
    LayoutUtils.openComponentInStack(stack, config);
    // openComponentInStack attempts to maintain the focus
    // Focus open tab if it's editable
    if (!isPreview) {
      LayoutUtils.activateTab(this.layout.root, { id });
    }
  }

  /** Attempts to send the text to a notebook matching the passed in settings */
  sendToNotebook(
    session,
    sessionLanguage,
    settings = {},
    createIfNecessary = true
  ) {
    const notebookPanel = this.panelManager.getLastUsedPanelOfType(
      NotebookPanel
    );
    if (notebookPanel) {
      if (settings && settings.value) {
        notebookPanel.notebook.append(settings.value);
      }
    } else if (createIfNecessary) {
      this.createNotebook(session, sessionLanguage, settings);
    }
  }

  registerFileTab(tabId, fileMetadata, isPreview) {
    log.debug('registerFileTab', tabId, fileMetadata, isPreview);
    if (!fileMetadata || !fileMetadata.id) {
      log.debug('Ignore empty file id', fileMetadata);
      return;
    }
    const { id } = fileMetadata;
    if (isPreview) {
      this.previewFileMap.set(id, tabId);
      return;
    }
    if (this.openFileMap.has(id)) {
      const existingTabId = this.openFileMap.get(id);
      if (tabId === existingTabId) {
        log.debug(`Update tab title for file ${id}`);
        const { itemName } = fileMetadata;
        this.renameFileTab(id, itemName);
      } else {
        log.error(
          `File ${id} already associated with a different tab ${existingTabId}`
        );
      }
      return;
    }

    this.openFileMap.set(id, tabId);

    // De-register preview tab
    if (this.previewFileMap.has(id)) {
      this.previewFileMap.delete(id);
    }
  }

  renameTab(id, newTitle) {
    LayoutUtils.renameComponent(this.layout.root, { id }, newTitle);
  }

  renameFileTab(fileId, newTitle) {
    log.debug('Rename file tab', fileId, newTitle);
    if (!this.openFileMap.has(fileId)) {
      log.debug(`File ${fileId} isn't open, no need to rename the tab`);
      return;
    }
    const id = this.openFileMap.get(fileId);
    this.renameTab(id, newTitle);
  }

  unregisterFileTab(fileMetadata, isPreview) {
    // Note: unregister event is triggered AFTER new register when switching from preview to edit mode
    // due to the LayoutUtils implementation (new tab added before deleting the old one)
    // This doesn't cause any issues because previews and editable files are stored in different maps,
    // but this situation could be completely avoided by sending an event to the tab
    // to make it switch from preview to edit mode without re-mounting and re-registering
    log.debug('unregisterFileTab', fileMetadata, isPreview);
    if (!fileMetadata || !fileMetadata.id) {
      log.debug('Ignore empty file id', fileMetadata);
      return;
    }
    const { id: fileId } = fileMetadata;
    if (isPreview) {
      this.previewFileMap.delete(fileId);
      return;
    }
    this.openFileMap.delete(fileId);
  }

  activateFileTab(fileMetadata) {
    const id = this.getTabIdForFileMetadata(fileMetadata, false);
    if (id == null) {
      log.error('Could not find tab id for file metadata', fileMetadata);
      return;
    }
    LayoutUtils.activateTab(this.layout.root, { id });
  }

  closeFileTab(fileMetadata) {
    log.debug('closeFileTab', fileMetadata);
    const { id: fileId } = fileMetadata;
    let id = null;
    let isPreview = false;
    if (this.openFileMap.has(fileId)) {
      id = this.openFileMap.get(fileId);
    } else if (this.previewFileMap.has(fileId)) {
      id = this.previewFileMap.get(fileId);
      isPreview = true;
    } else {
      log.debug(`File ${fileId} isn't open, ignore close event`);
      return;
    }
    this.unregisterFileTab(fileMetadata, isPreview);
    LayoutUtils.closeComponent(this.layout.root, {
      id,
    });
  }

  fileIsOpen(fileMetadata) {
    const { id } = fileMetadata;
    log.debug('fileIsOpen', fileMetadata, id, ...this.openFileMap);
    return id && this.openFileMap.has(id);
  }

  fileIsOpenAsPreview(fileMetadata) {
    const { id } = fileMetadata;
    log.debug('fileIsOpenAsPreview', fileMetadata, id, ...this.openFileMap);
    return id && this.previewFileMap.has(id);
  }

  fileIsActive(fileMetadata) {
    const id = this.getTabIdForFileMetadata(fileMetadata, false);
    return id != null && LayoutUtils.isActiveTab(this.layout.root, { id });
  }
}

export default NotebookEventHandler;
