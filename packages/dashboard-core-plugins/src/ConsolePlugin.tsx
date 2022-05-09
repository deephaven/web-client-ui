import { ScriptEditor } from '@deephaven/console';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelComponent,
  useListener,
} from '@deephaven/dashboard';
import { FileUtils } from '@deephaven/file-explorer';
import Log from '@deephaven/log';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import shortid from 'shortid';
import { ConsoleEvent, NotebookEvent } from './events';
import {
  ConsolePanel,
  CommandHistoryPanel,
  FileExplorerPanel,
  LogPanel,
  NotebookPanel,
} from './panels';
import { setDashboardConsoleSettings } from './redux';

const log = Log.module('ConsolePlugin');

type NotebookPanelComponent = PanelComponent & {
  notebook: ScriptEditor;
  focus: () => void;
};

function isNotebookPanel(
  panel: PanelComponent
): panel is NotebookPanelComponent {
  return (panel as NotebookPanelComponent).notebook !== undefined;
}

export type ConsolePluginProps = Partial<DashboardPluginComponentProps>;

export const ConsolePlugin = (props: ConsolePluginProps): JSX.Element => {
  assertIsDashboardPluginProps(props);
  const { id, layout, panelManager, registerComponent } = props;
  const notebookIndex = useRef(0);
  // Map from file ID to panel ID
  const [openFileMap] = useState(new Map<string, string>());
  const [previewFileMap] = useState(new Map<string, string>());

  const dispatch = useDispatch();

  const getConsolePanel = useCallback(
    () => panelManager.getLastUsedPanelOfType(ConsolePanel),
    [panelManager]
  );

  const handleSendCommand = useCallback(
    (command: string, focus = true, execute = true) => {
      const trimmedCommand = command && command.trim();
      if (!trimmedCommand) {
        log.info('Ignoring empty code');
      } else {
        const consolePanel = getConsolePanel();
        if (
          !consolePanel ||
          !(consolePanel instanceof ConsolePanel.WrappedComponent)
        ) {
          log.error('Console panel not found');
          return;
        }
        log.debug('Send command: ', command, focus, execute);
        consolePanel.addCommand(command, focus, execute);
      }
    },
    [getConsolePanel]
  );

  const handleSettingsChanged = useCallback(
    consoleSettings => {
      dispatch(setDashboardConsoleSettings(id, consoleSettings));
    },
    [dispatch, id]
  );

  const getNotebookFileName = useCallback(({ language }) => {
    const extension = language === 'python' ? 'py' : language;
    let title = null;
    if (!extension) {
      log.debug('No extension for language', language);
      title = `Untitled-${notebookIndex.current}`;
    } else {
      title = `Untitled-${notebookIndex.current}.${extension}`;
    }
    notebookIndex.current += 1;
    return title;
  }, []);

  const getPanelIdForFileMetadata = useCallback(
    (fileMetadata, createIfNecessary = true) => {
      const { id: fileId } = fileMetadata;
      if (fileId && openFileMap.has(fileId)) {
        return openFileMap.get(fileId);
      }
      if (fileId && previewFileMap.has(fileId)) {
        return previewFileMap.get(fileId);
      }
      if (createIfNecessary) {
        return shortid.generate();
      }
      return null;
    },
    [openFileMap, previewFileMap]
  );

  const renamePanel = useCallback(
    (panelId, newTitle) => {
      LayoutUtils.renameComponent(layout.root, { id: panelId }, newTitle);
    },
    [layout.root]
  );

  const renameFilePanel = useCallback(
    (oldName, newName) => {
      log.debug('Rename file panel', oldName, newName);
      let panelId;
      if (openFileMap.has(oldName)) {
        panelId = openFileMap.get(oldName);
        openFileMap.delete(oldName);
        if (panelId != null) {
          openFileMap.set(newName, panelId);
        }
      }
      if (previewFileMap.has(oldName)) {
        panelId = previewFileMap.get(oldName);
        previewFileMap.delete(oldName);
        if (panelId != null) {
          previewFileMap.set(newName, panelId);
        }
      }

      if (!panelId) {
        log.debug2(`File ${oldName} isn't open, no need to rename the tab`);
        return;
      }

      renamePanel(panelId, FileUtils.getBaseName(newName));
    },
    [openFileMap, previewFileMap, renamePanel]
  );

  /**
   * Show the panel for the given file metadata.
   * If the panel is not already open, then it just logs an error and does nothing.
   */
  const showFilePanel = useCallback(
    fileMetadata => {
      const panelId = getPanelIdForFileMetadata(fileMetadata, false);
      if (panelId == null) {
        log.error('Could not find panel id for file metadata', fileMetadata);
        return;
      }
      LayoutUtils.activateTab(layout.root, { id: panelId });
    },
    [getPanelIdForFileMetadata, layout.root]
  );

  const registerFilePanel = useCallback(
    (panelId, fileMetadata, isPreview) => {
      log.debug('registerFilePanel', panelId, fileMetadata, isPreview);
      if (!fileMetadata || !fileMetadata.id) {
        log.debug('Ignore empty file id', fileMetadata);
        return;
      }
      const { id: fileId } = fileMetadata;
      if (isPreview) {
        previewFileMap.set(fileId, panelId);
        return;
      }
      if (openFileMap.has(fileId)) {
        const existingPanelId = openFileMap.get(fileId);
        if (panelId === existingPanelId) {
          log.debug(`Update tab title for file ${fileId}`);
          const { itemName } = fileMetadata;
          renameFilePanel(fileId, FileUtils.getBaseName(itemName));
        } else {
          log.error(
            `File ${fileId} already associated with a different tab ${existingPanelId}`
          );
        }
        return;
      }

      openFileMap.set(fileId, panelId);

      // De-register preview tab
      if (previewFileMap.has(fileId)) {
        previewFileMap.delete(fileId);
      }
    },
    [openFileMap, previewFileMap, renameFilePanel]
  );

  const unregisterFilePanel = useCallback(
    (fileMetadata, isPreview) => {
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
        previewFileMap.delete(fileId);
        return;
      }
      openFileMap.delete(fileId);
    },
    [openFileMap, previewFileMap]
  );

  const closeFilePanel = useCallback(
    fileMetadata => {
      log.debug('closeFilePanel', fileMetadata);
      const { id: fileId } = fileMetadata;
      let panelId = null;
      let isPreview = false;
      if (openFileMap.has(fileId)) {
        panelId = openFileMap.get(fileId);
      } else if (previewFileMap.has(fileId)) {
        panelId = previewFileMap.get(fileId);
        isPreview = true;
      } else {
        log.debug(`File ${fileId} isn't open, ignore close event`);
        return;
      }
      unregisterFilePanel(fileMetadata, isPreview);
      LayoutUtils.closeComponent(layout.root, { id: panelId });
    },
    [layout.root, openFileMap, previewFileMap, unregisterFilePanel]
  );

  const getNotebookTitle = useCallback(fileMetadata => {
    const { itemName } = fileMetadata;
    return FileUtils.getBaseName(itemName);
  }, []);

  const fileIsOpen = useCallback(
    fileMetadata => {
      const { id: fileId } = fileMetadata;
      log.debug('fileIsOpen', fileMetadata, fileId, openFileMap);
      return fileId && openFileMap.has(fileId);
    },
    [openFileMap]
  );

  const fileIsOpenAsPreview = useCallback(
    fileMetadata => {
      const { id: fileId } = fileMetadata;
      log.debug('fileIsOpenAsPreview', fileMetadata, fileId, previewFileMap);
      return fileId && previewFileMap.has(fileId);
    },
    [previewFileMap]
  );

  /**
   * Attempts to focus the panel with the provided panelId
   */
  const focusPanelById = useCallback(
    panelId => {
      if (!panelId) {
        return;
      }

      const panel = panelManager.getOpenedPanelById(panelId);
      if (panel && isNotebookPanel(panel)) {
        panel.focus();
      }
    },
    [panelManager]
  );

  const makeConfig = useCallback(
    ({
      id: panelId,
      settings,
      fileMetadata,
      session,
      sessionLanguage,
      isPreview = false,
    }) => {
      const panelState = {
        settings,
        fileMetadata,
      };
      const title = getNotebookTitle(fileMetadata);
      return {
        type: 'react-component',
        component: NotebookPanel.COMPONENT,
        isFocusOnShow: false,
        props: {
          localDashboardId: id,
          metadata: { id: panelId },
          session,
          sessionLanguage,
          panelState,
          isPreview,
        },
        title,
        id: panelId,
      };
    },
    [getNotebookTitle, id]
  );

  const createNotebook = useCallback(
    (
      session,
      sessionLanguage,
      settings,
      fileMetadata = { id: null, itemName: getNotebookFileName(settings) }
    ) => {
      const panelId = getPanelIdForFileMetadata(fileMetadata);
      if (fileIsOpen(fileMetadata) && panelId) {
        log.debug('File is already open, focus panel');
        showFilePanel(fileMetadata);
        focusPanelById(panelId);
        return;
      }
      const stack = LayoutUtils.getStackForComponentTypes(layout.root, [
        NotebookPanel.COMPONENT,
      ]);
      const config = makeConfig({
        id: panelId,
        settings,
        fileMetadata,
        session,
        sessionLanguage,
      });
      log.debug('createNotebook', config, openFileMap);
      LayoutUtils.openComponentInStack(stack, config);
    },
    [
      fileIsOpen,
      focusPanelById,
      getNotebookFileName,
      getPanelIdForFileMetadata,
      layout.root,
      makeConfig,
      openFileMap,
      showFilePanel,
    ]
  );

  const selectNotebook = useCallback(
    (session, sessionLanguage, settings, fileMetadata, shouldFocus = false) => {
      log.debug('selectNotebook', fileMetadata, shouldFocus);
      const isFileOpen = fileIsOpen(fileMetadata);
      const isFileOpenAsPreview = fileIsOpenAsPreview(fileMetadata);

      // If the file is already open, just show and focus it if necessary
      if (isFileOpen) {
        showFilePanel(fileMetadata);
        if (shouldFocus) {
          const panelId = getPanelIdForFileMetadata(fileMetadata);
          focusPanelById(panelId);
        }
        return;
      }

      // If the file is already open as a preview and we're not focusing it, just show it
      // If we're focusing it, that means we need to replace the panel anyway with a non-preview panel, so just fall into the logic below
      if (isFileOpenAsPreview && !shouldFocus) {
        showFilePanel(fileMetadata);
        return;
      }

      const [previewTabId] = Array.from(previewFileMap.values());
      let panelId = null;
      let stack = null;
      if (previewTabId != null) {
        panelId = previewTabId;
        stack = LayoutUtils.getStackForConfig(layout.root, {
          component: NotebookPanel.COMPONENT,
          id: panelId,
        });
      }
      if (stack == null) {
        panelId = getPanelIdForFileMetadata(fileMetadata);
        stack = LayoutUtils.getStackForComponentTypes(layout.root, [
          NotebookPanel.COMPONENT,
        ]);
      }
      const config = makeConfig({
        id: panelId,
        settings,
        fileMetadata,
        session,
        sessionLanguage,
        isPreview: !shouldFocus,
      });
      LayoutUtils.openComponentInStack(stack, config);
      if (shouldFocus) {
        // Focus the tab we just opened if we're supposed to
        focusPanelById(panelId);
      }
    },
    [
      showFilePanel,
      fileIsOpen,
      fileIsOpenAsPreview,
      focusPanelById,
      getPanelIdForFileMetadata,
      layout.root,
      makeConfig,
      previewFileMap,
    ]
  );

  /** Attempts to send the text to a notebook matching the passed in settings */
  const sendToNotebook = useCallback(
    (session, sessionLanguage, settings = {}, createIfNecessary = true) => {
      const notebookPanel = panelManager.getLastUsedPanelOfType(NotebookPanel);
      if (notebookPanel && isNotebookPanel(notebookPanel)) {
        if (settings && settings.value && notebookPanel.notebook) {
          notebookPanel.notebook.append(settings.value);
        }
      } else if (createIfNecessary) {
        createNotebook(session, sessionLanguage, settings);
      }
    },
    [createNotebook, panelManager]
  );

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        registerComponent(ConsolePanel.COMPONENT, ConsolePanel),
        registerComponent(CommandHistoryPanel.COMPONENT, CommandHistoryPanel),
        registerComponent(FileExplorerPanel.COMPONENT, FileExplorerPanel),
        registerComponent(LogPanel.COMPONENT, LogPanel),
        registerComponent(NotebookPanel.COMPONENT, NotebookPanel),
      ];

      return () => {
        cleanups.forEach(cleanup => cleanup());
      };
    },
    [registerComponent]
  );

  useListener(layout.eventHub, ConsoleEvent.SEND_COMMAND, handleSendCommand);
  useListener(
    layout.eventHub,
    ConsoleEvent.SETTINGS_CHANGED,
    handleSettingsChanged
  );
  useListener(layout.eventHub, NotebookEvent.CLOSE_FILE, closeFilePanel);
  useListener(layout.eventHub, NotebookEvent.CREATE_NOTEBOOK, createNotebook);
  useListener(layout.eventHub, NotebookEvent.SELECT_NOTEBOOK, selectNotebook);
  useListener(layout.eventHub, NotebookEvent.RENAME, renamePanel);
  useListener(layout.eventHub, NotebookEvent.RENAME_FILE, renameFilePanel);
  useListener(layout.eventHub, NotebookEvent.SEND_TO_NOTEBOOK, sendToNotebook);
  useListener(layout.eventHub, NotebookEvent.REGISTER_FILE, registerFilePanel);
  useListener(
    layout.eventHub,
    NotebookEvent.UNREGISTER_FILE,
    unregisterFilePanel
  );

  return <></>;
};

export default ConsolePlugin;
