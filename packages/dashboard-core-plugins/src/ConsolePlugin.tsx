import { ScriptEditor } from '@deephaven/console';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelComponent,
  useListener,
} from '@deephaven/dashboard';
import { FileUtils } from '@deephaven/file-explorer';
import Log from '@deephaven/log';
import React, {
  ComponentType,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
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
};

function isNotebookPanel(
  panel: PanelComponent
): panel is NotebookPanelComponent {
  return (panel as NotebookPanelComponent).notebook !== undefined;
}

export const ConsolePlugin = ({
  id,
  layout,
  panelManager,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const notebookIndex = useRef(0);
  // Map from file ID to panel ID
  const [openFileMap] = useState(new Map<string, string>());
  const [previewFileMap] = useState(new Map<string, string>());

  const dispatch = useDispatch();

  const getConsolePanel = useCallback(
    () => panelManager.getLastUsedPanelOfType(ConsolePanel.WrappedComponent),
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

  const activateFilePanel = useCallback(
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
      log.debug('fileIsOpenAsPreview', fileMetadata, fileId, openFileMap);
      return fileId && previewFileMap.has(fileId);
    },
    [openFileMap, previewFileMap]
  );

  const fileIsActive = useCallback(
    fileMetadata => {
      const panelId = getPanelIdForFileMetadata(fileMetadata, false);
      return (
        panelId != null && LayoutUtils.isActiveTab(layout.root, { id: panelId })
      );
    },
    [getPanelIdForFileMetadata, layout.root]
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
      if (fileIsOpen(fileMetadata)) {
        log.debug('File is already open, focus tab');
        LayoutUtils.activateTab(layout.root, { id: panelId });
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
      getNotebookFileName,
      getPanelIdForFileMetadata,
      layout.root,
      makeConfig,
      openFileMap,
    ]
  );

  const selectNotebook = useCallback(
    (session, sessionLanguage, settings, fileMetadata) => {
      log.debug('selectNotebook', fileMetadata);
      let previewTabId = null;
      let isPreview = true;
      const isFileOpen = fileIsOpen(fileMetadata);
      const isFileOpenAsPreview = fileIsOpenAsPreview(fileMetadata);

      if (!isFileOpen && !isFileOpenAsPreview) {
        log.debug('selectNotebook, file not open');
        if (previewFileMap.size > 0) {
          log.debug('selectNotebook, file not open, previewFileMap not empty');
          // Existing preview tab id to reuse
          [previewTabId] = Array.from(previewFileMap.values());
        }
      } else {
        // File already open in background
        if (!fileIsActive(fileMetadata)) {
          activateFilePanel(fileMetadata);
          return;
        }
        // File already open in foreground, not in preview mode
        if (!isFileOpenAsPreview) {
          activateFilePanel(fileMetadata);
          return;
        }
        // File already open in foreground in preview mode
        [previewTabId] = Array.from(previewFileMap.values());
        isPreview = false;
      }
      let panelId = null;
      let stack = null;
      if (previewTabId != null) {
        panelId = previewTabId;
        stack = LayoutUtils.getStackForConfig(layout.root, {
          component: NotebookPanel.COMPONENT,
          id,
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
        isPreview,
      });
      LayoutUtils.openComponentInStack(stack, config);
      // openComponentInStack attempts to maintain the focus
      // Focus open tab if it's editable
      if (!isPreview) {
        LayoutUtils.activateTab(layout.root, { id: panelId });
      }
    },
    [
      activateFilePanel,
      fileIsActive,
      fileIsOpen,
      fileIsOpenAsPreview,
      getPanelIdForFileMetadata,
      id,
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

  useEffect(() => {
    const cleanups = [
      registerComponent(
        ConsolePanel.COMPONENT,
        (ConsolePanel as unknown) as ComponentType
      ),
      registerComponent(
        CommandHistoryPanel.COMPONENT,
        (CommandHistoryPanel as unknown) as ComponentType
      ),
      registerComponent(
        FileExplorerPanel.COMPONENT,
        (FileExplorerPanel as unknown) as ComponentType
      ),
      registerComponent(
        LogPanel.COMPONENT,
        (LogPanel as unknown) as ComponentType
      ),
      registerComponent(
        NotebookPanel.COMPONENT,
        (NotebookPanel as unknown) as ComponentType
      ),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

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
