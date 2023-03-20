import { ScriptEditor } from '@deephaven/console';
import {
  assertIsDashboardPluginProps,
  DashboardPanelProps,
  DashboardPluginComponentProps,
  DashboardUtils,
  LayoutUtils,
  PanelComponent,
  PanelHydrateFunction,
  PanelProps,
  useListener,
} from '@deephaven/dashboard';
import { FileUtils } from '@deephaven/file-explorer';
import { CloseOptions } from '@deephaven/golden-layout';
import Log from '@deephaven/log';
import { useCallback, useEffect, useRef, useState } from 'react';
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

export type ConsolePluginProps = DashboardPluginComponentProps & {
  hydrateConsole?: PanelHydrateFunction;
  notebooksUrl: string;
};

function assertIsConsolePluginProps(
  props: Partial<ConsolePluginProps>
): asserts props is ConsolePluginProps {
  assertIsDashboardPluginProps(props);
}

export interface FileMetadata {
  id: string | null;
  itemName: string;
}

export function ConsolePlugin(
  props: Partial<ConsolePluginProps>
): JSX.Element | null {
  assertIsConsolePluginProps(props);
  const {
    id,
    hydrateConsole,
    layout,
    panelManager,
    registerComponent,
    notebooksUrl,
  } = props;
  const notebookIndex = useRef(0);
  // Map from file ID to panel ID
  const [openFileMap, setOpenFileMap] = useState(new Map<string, string>());
  const [previewFileMap, setPreviewFileMap] = useState(
    new Map<string, string>()
  );

  const dispatch = useDispatch();

  const getConsolePanel = useCallback(
    () => panelManager.getLastUsedPanelOfType(ConsolePanel),
    [panelManager]
  );

  const addOpenFileMapEntry = useCallback(
    (key: string, value: string) => {
      setOpenFileMap(map => new Map(map.set(key, value)));
    },
    [setOpenFileMap]
  );

  const deleteOpenFileMapEntry = useCallback(
    (key: string) => {
      setOpenFileMap(map => {
        map.delete(key);
        return new Map(map);
      });
    },
    [setOpenFileMap]
  );

  const addPreviewFileMapEntry = useCallback(
    (key: string, value: string) => {
      setPreviewFileMap(map => new Map(map.set(key, value)));
    },
    [setPreviewFileMap]
  );

  const deletePreviewFileMapEntry = useCallback(
    (key: string) => {
      setPreviewFileMap(map => {
        map.delete(key);
        return new Map(map);
      });
    },
    [setPreviewFileMap]
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
    if (extension == null) {
      log.debug('No extension for language', language);
      title = `Untitled-${notebookIndex.current}`;
    } else {
      title = `Untitled-${notebookIndex.current}.${extension}`;
    }
    notebookIndex.current += 1;
    return title;
  }, []);

  const getPanelIdForFileMetadata = useCallback(
    (fileMetadata: FileMetadata, createIfNecessary = true) => {
      const { id: fileId } = fileMetadata;
      if (fileId != null && openFileMap.has(fileId)) {
        return openFileMap.get(fileId);
      }
      if (fileId != null && previewFileMap.has(fileId)) {
        return previewFileMap.get(fileId);
      }
      if (createIfNecessary as boolean) {
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
        deleteOpenFileMapEntry(oldName);
        if (panelId != null) {
          addOpenFileMapEntry(newName, panelId);
        }
      }
      if (previewFileMap.has(oldName)) {
        panelId = previewFileMap.get(oldName);
        deletePreviewFileMapEntry(oldName);
        if (panelId != null) {
          addPreviewFileMapEntry(newName, panelId);
        }
      }

      if (panelId === undefined) {
        log.debug2(`File ${oldName} isn't open, no need to rename the tab`);
        return;
      }

      renamePanel(panelId, FileUtils.getBaseName(newName));
    },
    [
      openFileMap,
      previewFileMap,
      renamePanel,
      addOpenFileMapEntry,
      addPreviewFileMapEntry,
      deleteOpenFileMapEntry,
      deletePreviewFileMapEntry,
    ]
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
    (panelId, fileMetadata: FileMetadata, isPreview: boolean) => {
      log.debug('registerFilePanel', panelId, fileMetadata, isPreview);
      if (fileMetadata == null || fileMetadata.id == null) {
        log.debug('Ignore empty file id', fileMetadata);
        return;
      }
      const { id: fileId } = fileMetadata;
      if (isPreview) {
        addPreviewFileMapEntry(fileId, panelId);
        return;
      }
      if (openFileMap.has(fileId)) {
        const existingPanelId = openFileMap.get(fileId);
        if (panelId === existingPanelId) {
          log.debug(`Update tab title for file ${fileId}`);
          const { itemName } = fileMetadata;
          renameFilePanel(fileId, itemName);
        } else {
          log.error(
            `File ${fileId} already associated with a different tab ${existingPanelId}`
          );
        }
        return;
      }

      addOpenFileMapEntry(fileId, panelId);

      // De-register preview tab
      if (previewFileMap.has(fileId)) {
        deletePreviewFileMapEntry(fileId);
      }
    },
    [
      openFileMap,
      previewFileMap,
      renameFilePanel,
      addOpenFileMapEntry,
      addPreviewFileMapEntry,
      deletePreviewFileMapEntry,
    ]
  );

  const unregisterFilePanel = useCallback(
    (fileMetadata: FileMetadata, isPreview: boolean) => {
      // Note: unregister event is triggered AFTER new register when switching from preview to edit mode
      // due to the LayoutUtils implementation (new tab added before deleting the old one)
      // This doesn't cause any issues because previews and editable files are stored in different maps,
      // but this situation could be completely avoided by sending an event to the tab
      // to make it switch from preview to edit mode without re-mounting and re-registering
      log.debug('unregisterFileTab', fileMetadata, isPreview);
      if (fileMetadata == null || fileMetadata.id == null) {
        log.debug('Ignore empty file id', fileMetadata);
        return;
      }
      const { id: fileId } = fileMetadata;
      if (isPreview) {
        deletePreviewFileMapEntry(fileId);
        return;
      }
      deleteOpenFileMapEntry(fileId);
    },
    [deleteOpenFileMapEntry, deletePreviewFileMapEntry]
  );

  const closeFilePanel = useCallback(
    (fileMetadata, options?: CloseOptions) => {
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
      LayoutUtils.closeComponent(layout.root, { id: panelId }, options);
    },
    [layout.root, openFileMap, previewFileMap, unregisterFilePanel]
  );

  const getNotebookTitle = useCallback(fileMetadata => {
    const { itemName } = fileMetadata;
    return FileUtils.getBaseName(itemName);
  }, []);

  const fileIsOpen = useCallback(
    (fileMetadata: FileMetadata) => {
      const { id: fileId } = fileMetadata;
      log.debug('fileIsOpen', fileMetadata, fileId, openFileMap);
      return fileId != null && openFileMap.has(fileId);
    },
    [openFileMap]
  );

  const fileIsOpenAsPreview = useCallback(
    fileMetadata => {
      const { id: fileId } = fileMetadata;
      log.debug('fileIsOpenAsPreview', fileMetadata, fileId, previewFileMap);
      return fileId != null && previewFileMap.has(fileId);
    },
    [previewFileMap]
  );

  /*
   * Attempts to focus the panel with the provided panelId
   */
  const focusPanelById = useCallback(
    panelId => {
      if (panelId == null) {
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
        type: 'react-component' as const,
        component: NotebookPanel.COMPONENT,
        isFocusOnShow: false,
        props: {
          localDashboardId: id,
          metadata: { id: panelId },
          session,
          sessionLanguage,
          panelState,
          isPreview,
          notebooksUrl,
        },
        title,
        id: panelId,
      };
    },
    [getNotebookTitle, id, notebooksUrl]
  );

  const createNotebook = useCallback(
    (
      session,
      sessionLanguage,
      settings,
      fileMetadata = { id: null, itemName: getNotebookFileName(settings) }
    ) => {
      const panelId = getPanelIdForFileMetadata(fileMetadata);
      if (fileIsOpen(fileMetadata) && panelId != null) {
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
    (
      session,
      sessionLanguage,
      settings,
      fileMetadata,
      // linter recognizes shouldFocus as any if I don't specify boolean here
      // eslint-disable-next-line @typescript-eslint/no-inferrable-types
      shouldFocus: boolean = false
    ) => {
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
        if (
          settings != null &&
          settings.value != null &&
          notebookPanel.notebook != null
        ) {
          notebookPanel.notebook.append(settings.value);
        }
      } else if (createIfNecessary as boolean) {
        createNotebook(session, sessionLanguage, settings);
      }
    },
    [createNotebook, panelManager]
  );

  const hydrateNotebook = useCallback(
    (panelProps: PanelProps, panelDashboardId: string): DashboardPanelProps =>
      DashboardUtils.hydrate(
        {
          ...panelProps,
          notebooksUrl,
        },
        panelDashboardId
      ),
    [notebooksUrl]
  );

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        registerComponent(ConsolePanel.COMPONENT, ConsolePanel, hydrateConsole),
        registerComponent(CommandHistoryPanel.COMPONENT, CommandHistoryPanel),
        registerComponent(FileExplorerPanel.COMPONENT, FileExplorerPanel),
        registerComponent(LogPanel.COMPONENT, LogPanel),
        registerComponent(
          NotebookPanel.COMPONENT,
          NotebookPanel,
          hydrateNotebook
        ),
      ];

      return () => {
        cleanups.forEach(cleanup => cleanup());
      };
    },
    [registerComponent, hydrateConsole, hydrateNotebook]
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

  return null;
}

export default ConsolePlugin;
