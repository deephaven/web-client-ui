/**
 * Console display for use in the Iris environment.
 */
import React, {
  DragEvent,
  PureComponent,
  ReactElement,
  ReactNode,
  RefObject,
} from 'react';
import { ContextActions, DropdownAction } from '@deephaven/components';
import { vsCheck } from '@deephaven/icons';
import classNames from 'classnames';
import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import type { JSZipObject } from 'jszip';
import type {
  dh as DhType,
  IdeSession,
  LogItem,
  VariableChanges,
  VariableDefinition,
} from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { assertNotNull, Pending, PromiseUtils } from '@deephaven/utils';
import ConsoleHistory from './console-history/ConsoleHistory';
import { ConsoleHistoryActionItem } from './console-history/ConsoleHistoryTypes';
import SHORTCUTS from './ConsoleShortcuts';
import LogLevel from './log/LogLevel';
import ConsoleInput from './ConsoleInput';
import CsvOverlay from './csv/CsvOverlay';
import CsvInputBar from './csv/CsvInputBar';
import './Console.scss';
import ConsoleStatusBar from './ConsoleStatusBar';
import {
  CommandHistoryStorage,
  CommandHistoryStorageItem,
} from './command-history';

const log = Log.module('Console');

interface Settings {
  isAutoLaunchPanelsEnabled: boolean;
  isPrintStdOutEnabled: boolean;
  isClosePanelsOnDisconnectEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  isAutoLaunchPanelsEnabled: true,
  isPrintStdOutEnabled: true,
  isClosePanelsOnDisconnectEnabled: true,
} as const;

interface ConsoleProps {
  dh: DhType;
  statusBarChildren: ReactNode;
  settings: Partial<Settings>;
  focusCommandHistory: () => void;
  openObject: (object: VariableDefinition) => void;
  closeObject: (object: VariableDefinition) => void;
  session: IdeSession;
  language: string;
  commandHistoryStorage: CommandHistoryStorage;
  onSettingsChange: (settings: Record<string, unknown>) => void;
  scope: string;
  actions: DropdownAction[];
  timeZone: string;

  // Children shown at the bottom of the console history
  historyChildren: ReactNode;

  // Known object map
  objectMap: Map<string, VariableDefinition>;

  disabled: boolean;

  /**
   * Function to unzip a zip file. If not provided, zip files will not be accepted
   * (file:File) => Promise<File[]>
   */
  unzip: (file: File) => Promise<JSZipObject[]>;
  supportsType(type: string): boolean;
  iconForType(type: string): ReactElement;
}

interface ConsoleState {
  // Need separate histories as console history has stdout/stderr output
  consoleHistory: ConsoleHistoryActionItem[];

  // Height of the viewport of the console input and history
  consoleHeight: number;

  isScrollDecorationShown: boolean;

  // Location of objects in the console history
  objectHistoryMap: Map<string, number>;

  // The object definitions, name/type
  objectMap: Map<string, VariableDefinition>;

  showCsvOverlay: boolean;
  csvFile: File | null;
  csvPaste: string | null;
  dragError: string | null;
  csvUploadInProgress: boolean;
  isAutoLaunchPanelsEnabled: boolean;
  isPrintStdOutEnabled: boolean;
  isClosePanelsOnDisconnectEnabled: boolean;
}

function defaultSupportsType(): boolean {
  return true;
}

function defaultIconForType(type: string): ReactElement {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
}

export class Console extends PureComponent<ConsoleProps, ConsoleState> {
  static defaultProps = {
    statusBarChildren: null,
    settings: {},
    onSettingsChange: (): void => undefined,
    scope: null,
    actions: [],
    historyChildren: null,
    timeZone: 'America/New_York',
    objectMap: new Map(),
    disabled: false,
    unzip: null,
    supportsType: defaultSupportsType,
    iconForType: defaultIconForType,
  };

  static LOG_THROTTLE = 500;

  /**
   * Check if the provided log level is an error type
   * @param logLevel The LogLevel being checked
   * @returns true if the log level is an error level log
   */
  static isErrorLevel(logLevel: string): boolean {
    return (
      logLevel === LogLevel.STDERR ||
      logLevel === LogLevel.ERROR ||
      logLevel === LogLevel.FATAL
    );
  }

  /**
   * Check if the provided log level is output level
   * @param logLevel The LogLevel being checked
   * @returns true if the log level should be output to the console
   */
  static isOutputLevel(
    logLevel: (typeof LogLevel)[keyof typeof LogLevel]
  ): boolean {
    // We want all errors to be output, in addition to STDOUT.
    // That way the user is more likely to see them.
    return logLevel === LogLevel.STDOUT || Console.isErrorLevel(logLevel);
  }

  constructor(props: ConsoleProps) {
    super(props);

    this.handleCommandResult = this.handleCommandResult.bind(this);
    this.handleCommandStarted = this.handleCommandStarted.bind(this);
    this.handleCommandSubmit = this.handleCommandSubmit.bind(this);
    this.handleClearShortcut = this.handleClearShortcut.bind(this);
    this.handleFocusHistory = this.handleFocusHistory.bind(this);
    this.handleLogMessage = this.handleLogMessage.bind(this);
    this.handleOverflowActions = this.handleOverflowActions.bind(this);
    this.handleScrollPaneScroll = this.handleScrollPaneScroll.bind(this);
    this.handleToggleAutoLaunchPanels =
      this.handleToggleAutoLaunchPanels.bind(this);
    this.handleToggleClosePanelsOnDisconnect =
      this.handleToggleClosePanelsOnDisconnect.bind(this);
    this.handleTogglePrintStdout = this.handleTogglePrintStdout.bind(this);
    this.handleUploadCsv = this.handleUploadCsv.bind(this);
    this.handleHideCsv = this.handleHideCsv.bind(this);
    this.handleCsvFileCanceled = this.handleCsvFileCanceled.bind(this);
    this.handleCsvFileOpened = this.handleCsvFileOpened.bind(this);
    this.handleCsvPaste = this.handleCsvPaste.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleClearDragError = this.handleClearDragError.bind(this);
    this.handleOpenCsvTable = this.handleOpenCsvTable.bind(this);
    this.handleCsvUpdate = this.handleCsvUpdate.bind(this);
    this.handleCsvError = this.handleCsvError.bind(this);
    this.handleCsvInProgress = this.handleCsvInProgress.bind(this);

    this.consolePane = React.createRef();
    this.consoleInput = React.createRef();
    this.consoleHistoryScrollPane = React.createRef();
    this.pending = new Pending();
    this.queuedLogMessages = [];

    const { objectMap, settings } = this.props;

    this.state = {
      // Need separate histories as console history has stdout/stderr output
      consoleHistory: [],

      // Height of the viewport of the console input and history
      consoleHeight: 0,

      isScrollDecorationShown: false,

      // Location of objects in the console history
      objectHistoryMap: new Map(),

      // The object definitions, name/type
      objectMap: new Map(objectMap),

      showCsvOverlay: false,
      csvFile: null,
      csvPaste: null,
      dragError: null,
      csvUploadInProgress: false,

      ...DEFAULT_SETTINGS,
      ...settings,
    };
  }

  componentDidMount(): void {
    this.initConsoleLogging();

    const { dh, session } = this.props;
    session.addEventListener(
      dh.IdeSession.EVENT_COMMANDSTARTED,
      this.handleCommandStarted
    );

    this.updateDimensions();
  }

  componentDidUpdate(prevProps: ConsoleProps, prevState: ConsoleState): void {
    const { props, state } = this;
    this.sendSettingsChange(prevState, state);

    if (props.objectMap !== prevProps.objectMap) {
      this.updateObjectMap();
    }
  }

  componentWillUnmount(): void {
    const { dh, session } = this.props;

    session.removeEventListener(
      dh.IdeSession.EVENT_COMMANDSTARTED,
      this.handleCommandStarted
    );

    this.pending.cancel();
    this.processLogMessageQueue.cancel();

    this.deinitConsoleLogging();
  }

  cancelListener?: () => void;

  consolePane: RefObject<HTMLDivElement>;

  consoleInput: RefObject<ConsoleInput>;

  consoleHistoryScrollPane: RefObject<HTMLDivElement>;

  pending: Pending;

  queuedLogMessages: ConsoleHistoryActionItem[];

  initConsoleLogging(): void {
    const { session } = this.props;
    this.cancelListener = session.onLogMessage(this.handleLogMessage);
  }

  deinitConsoleLogging(): void {
    if (this.cancelListener != null) {
      this.cancelListener();
      this.cancelListener = undefined;
    }
  }

  handleClearShortcut(event: CustomEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.consoleInput.current?.clear();
  }

  handleCommandStarted(event: CustomEvent): void {
    const { code, result } = event.detail;
    const wrappedResult = this.pending.add(result);
    const historyItem = {
      command: code,
      disabledObjects: [],
      startTime: Date.now(),
      cancelResult: () => {
        result.cancel();
      },
      wrappedResult,
    };

    const { commandHistoryStorage, language, scope } = this.props;
    const workspaceItemPromise = commandHistoryStorage.addItem(
      language,
      scope,
      code,
      {
        command: code,
        startTime: new Date().toJSON(),
      }
    );
    workspaceItemPromise.catch(err => {
      log.debug('Error adding workspace item', err);
    });

    this.setState(
      state => ({
        consoleHistory: state.consoleHistory.concat(historyItem),
      }),
      () => {
        this.scrollConsoleHistoryToBottom(true);
      }
    );

    wrappedResult
      .then(resolved => {
        this.handleCommandResult(resolved, historyItem, workspaceItemPromise);
      })
      .catch(error => {
        this.handleCommandError(error, historyItem, workspaceItemPromise);
      });
  }

  handleCommandResult(
    result:
      | {
          message: string;
          error?: string;
          changes: VariableChanges;
        }
      | undefined,
    historyItem: ConsoleHistoryActionItem,
    workspaceItemPromise: Promise<CommandHistoryStorageItem>
  ): void {
    const newHistoryItem = {
      ...historyItem,
      wrappedResult: undefined,
      cancelResult: undefined,
      result: result ?? historyItem.result,
    };

    this.setState(({ consoleHistory }) => {
      const itemIndex = consoleHistory.lastIndexOf(historyItem);
      if (itemIndex < 0) {
        log.error(`historyItem not found in consoleHistory`);
        return null;
      }
      const newHistory = consoleHistory.concat();
      newHistory[itemIndex] = newHistoryItem;

      return { consoleHistory: newHistory };
    });

    if (!result) {
      return;
    }

    this.updateHistory(result, newHistoryItem);
    this.updateKnownObjects(newHistoryItem);
    this.updateWorkspaceHistoryItem(
      { error: result.error },
      workspaceItemPromise
    );

    this.closeRemovedItems(result.changes);
    this.openUpdatedItems(result.changes);
  }

  handleCommandError(
    error: unknown,
    historyItem: ConsoleHistoryActionItem,
    workspaceItemPromise: Promise<CommandHistoryStorageItem>
  ): void {
    if (PromiseUtils.isCanceled(error)) {
      log.debug('Called handleCommandError on a cancelled promise result');
      return;
    }

    this.updateWorkspaceHistoryItem(
      { error: `${error}` },
      workspaceItemPromise
    );

    this.setState(state => {
      const history = state.consoleHistory.concat();
      const index = history.lastIndexOf(historyItem);
      const newHistoryItem = { ...historyItem };
      newHistoryItem.wrappedResult = undefined;
      newHistoryItem.cancelResult = undefined;
      newHistoryItem.endTime = Date.now();
      newHistoryItem.result = { error };
      history[index] = newHistoryItem;
      return { consoleHistory: history };
    });
  }

  handleFocusHistory(event: CustomEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const { focusCommandHistory } = this.props;
    focusCommandHistory();
  }

  handleLogMessage(message: LogItem): void {
    const { isPrintStdOutEnabled } = this.state;
    if (!isPrintStdOutEnabled) {
      return;
    }

    if (
      Console.isOutputLevel(
        message.logLevel as (typeof LogLevel)[keyof typeof LogLevel]
      )
    ) {
      this.queueLogMessage(message.message, message.logLevel);
    }
  }

  queueLogMessage(message: string, logLevel: string): void {
    const result: Record<string, string> = {};
    if (
      Console.isErrorLevel(logLevel as (typeof LogLevel)[keyof typeof LogLevel])
    ) {
      result.error = message;
    } else {
      result.message = message;
    }

    const historyItem = { command: undefined, result };

    this.queuedLogMessages.push(historyItem);

    this.processLogMessageQueue();
  }

  processLogMessageQueue = throttle(() => {
    this.scrollConsoleHistoryToBottom();

    this.setState(state => {
      log.debug2(
        'processLogMessageQueue',
        this.queuedLogMessages.length,
        ' items'
      );

      let { consoleHistory } = state;
      consoleHistory = consoleHistory.concat(this.queuedLogMessages);
      this.queuedLogMessages = [];

      return { consoleHistory };
    });
  }, Console.LOG_THROTTLE);

  openUpdatedItems(changes: VariableChanges): void {
    const { isAutoLaunchPanelsEnabled } = this.state;
    if (changes == null || !isAutoLaunchPanelsEnabled) {
      return;
    }

    const { openObject } = this.props;
    [...changes.created, ...changes.updated].forEach(object =>
      openObject(object)
    );
  }

  closeRemovedItems(changes: VariableChanges): void {
    if (
      changes == null ||
      changes.removed == null ||
      changes.removed.length === 0
    ) {
      return;
    }

    const { closeObject } = this.props;
    const { removed } = changes;
    removed.forEach(object => closeObject(object));
  }

  updateHistory(
    result: { changes: unknown },
    historyItemParam: ConsoleHistoryActionItem
  ): void {
    const historyItem = historyItemParam;
    if (result == null || result.changes == null || historyItem == null) {
      return;
    }

    historyItem.endTime = Date.now();

    this.scrollConsoleHistoryToBottom();

    // Update history to re-render items as necessary
    this.setState(state => {
      const consoleHistory = state.consoleHistory.concat();
      return { consoleHistory };
    });
  }

  updateKnownObjects(historyItem: ConsoleHistoryActionItem): void {
    let changes: undefined | VariableChanges;
    if (historyItem.result) {
      changes = historyItem.result.changes;
    }
    if (
      !changes ||
      ((changes.created == null || changes.created.length === 0) &&
        (changes.updated == null || changes.updated.length === 0) &&
        (changes.removed == null || changes.removed.length === 0))
    ) {
      log.debug2('updateKnownObjects no changes');
      return;
    }

    this.setState(state => {
      let { consoleHistory } = state;
      const itemIndex = consoleHistory.lastIndexOf(historyItem);
      if (itemIndex < 0) {
        log.error(`historyItem not found in state.consoleHistory`);
        return null;
      }

      const objectHistoryMap = new Map(state.objectHistoryMap);
      const objectMap = new Map(state.objectMap);

      const disableOldObject = (
        object: VariableDefinition,
        isRemoved = false
      ): void => {
        const { title } = object;
        assertNotNull(title);
        const oldIndex = objectHistoryMap.get(title);
        // oldIndex can be -1 if a object is active but doesn't have a command in consoleHistory
        // this can happen after clearing the console using 'clear' or 'cls' command

        if (oldIndex != null && oldIndex >= 0) {
          // disable outdated object variable in the old consoleHistory item
          if (consoleHistory === state.consoleHistory) {
            // First item in the history being updated,
            consoleHistory = consoleHistory.concat();
          }
          const newHistoryItem = {
            ...consoleHistory[oldIndex],
            disabledObjects: [
              ...(consoleHistory[oldIndex].disabledObjects ?? []),
              title,
            ],
          };
          consoleHistory[oldIndex] = newHistoryItem;
        }
        objectHistoryMap.set(title, itemIndex);
        if (isRemoved) {
          objectMap.delete(title);
        } else {
          objectMap.set(title, object);
        }
      };

      changes?.updated.forEach(object => disableOldObject(object));
      changes?.removed.forEach(object => disableOldObject(object, true));

      // Created objects have to be processed after removed
      // in case the same object name is present in both removed and created
      changes?.created.forEach(object => {
        const { title } = object;
        assertNotNull(title);
        objectHistoryMap.set(title, itemIndex);
        objectMap.set(title, object);
      });

      return { objectHistoryMap, objectMap, consoleHistory };
    });
  }

  updateObjectMap(): void {
    const { objectMap } = this.props;
    this.setState({ objectMap });
  }

  /**
   * Updates an existing workspace CommandHistoryItem
   * @param result The result to store with the history item. Could be empty object for success
   * @param workspaceItemPromise The workspace data row promise for the workspace item to be updated
   */
  updateWorkspaceHistoryItem(
    result: { error?: string },
    workspaceItemPromise: Promise<CommandHistoryStorageItem>
  ): void {
    const promise = this.pending.add(workspaceItemPromise);

    const endTime = new Date().toJSON();
    promise
      .then(workspaceItem => {
        const updatedItem = {
          ...workspaceItem,
          data: {
            ...workspaceItem.data,
            endTime,
            result,
          },
        };

        const { commandHistoryStorage, language } = this.props;
        commandHistoryStorage.updateItem(language, updatedItem).catch(err => {
          log.warn('Error updating command history storage', err);
        });
      })
      .catch(err => {
        log.debug('Error updating workspace history item', err);
      });
  }

  scrollConsoleHistoryToBottom(force = false): void {
    const pane = this.consoleHistoryScrollPane.current;
    assertNotNull(pane);
    if (
      !force &&
      Math.abs(pane.scrollHeight - pane.clientHeight - pane.scrollTop) >= 1
    ) {
      return;
    }

    window.requestAnimationFrame(() => {
      pane.scrollTop = pane.scrollHeight;
    });
  }

  handleScrollPaneScroll(): void {
    const scrollPane = this.consoleHistoryScrollPane.current;
    assertNotNull(scrollPane);
    if (
      scrollPane.scrollTop > 0 &&
      scrollPane.scrollHeight > scrollPane.clientHeight
    ) {
      this.setState({ isScrollDecorationShown: true });
    } else {
      this.setState({ isScrollDecorationShown: false });
    }
  }

  handleToggleAutoLaunchPanels(): void {
    this.setState(state => ({
      isAutoLaunchPanelsEnabled: !state.isAutoLaunchPanelsEnabled,
    }));
  }

  handleToggleClosePanelsOnDisconnect(): void {
    this.setState(state => ({
      isClosePanelsOnDisconnectEnabled: !state.isClosePanelsOnDisconnectEnabled,
    }));
  }

  handleTogglePrintStdout(): void {
    this.setState(state => ({
      isPrintStdOutEnabled: !state.isPrintStdOutEnabled,
    }));
  }

  handleUploadCsv(): void {
    this.setState({
      showCsvOverlay: true,
      dragError: null,
      csvUploadInProgress: false,
    });
  }

  handleHideCsv(): void {
    this.setState({
      showCsvOverlay: false,
      csvFile: null,
      csvPaste: null,
      dragError: null,
      csvUploadInProgress: false,
    });
  }

  handleCsvFileCanceled(): void {
    this.setState({ csvFile: null, csvPaste: null });
  }

  handleCsvFileOpened(file: File): void {
    this.setState({ csvFile: file, csvPaste: null });
  }

  handleCsvPaste(value: string): void {
    this.setState({ csvFile: null, csvPaste: value });
  }

  handleDragEnter(e: DragEvent<HTMLDivElement>): void {
    if (
      e.dataTransfer == null ||
      e.dataTransfer.items == null ||
      e.dataTransfer.items.length === 0 ||
      e.dataTransfer.items[0].kind === 'string'
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showCsvOverlay: true });

    const { items } = e.dataTransfer;
    if (items.length > 1) {
      this.setState({ dragError: CsvOverlay.MULTIPLE_FILE_ERROR });
      return;
    }

    const item = items[0];
    if (CsvOverlay.isValidDropItem(item)) {
      this.setState({ dragError: null });
    } else {
      this.setState({ dragError: CsvOverlay.FILE_TYPE_ERROR });
    }
  }

  handleDragLeave(e: DragEvent<HTMLDivElement>): void {
    // DragLeave gets fired for every child element, so make sure we're actually leaving the drop zone
    if (
      e.currentTarget == null ||
      (e.currentTarget instanceof Element &&
        e.relatedTarget instanceof Element &&
        e.currentTarget.contains(e.relatedTarget))
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showCsvOverlay: false, dragError: null });
  }

  handleClearDragError(): void {
    this.setState({ dragError: null });
  }

  handleOpenCsvTable(title: string): void {
    const { dh, openObject, commandHistoryStorage, language, scope } =
      this.props;
    const { consoleHistory, objectMap } = this.state;
    const object = { name: title, title, type: dh.VariableType.TABLE };
    const isExistingObject = objectMap.has(title);
    const historyItem = {
      startTime: Date.now(),
      endTime: Date.now(),
      disabledObjects: [],
      result: {
        changes: {
          created: [],
          updated: [],
          removed: [],
          [isExistingObject ? 'updated' : 'created']: [object],
        },
      },
    };

    const history = consoleHistory.concat(historyItem);
    this.setState({ consoleHistory: history });
    this.scrollConsoleHistoryToBottom(true);
    this.updateKnownObjects(historyItem);
    openObject({ name: title, title, type: dh.VariableType.TABLE });
    commandHistoryStorage.addItem(language, scope, title, {
      command: title,
      startTime: new Date().toJSON(),
      endTime: new Date().toJSON(),
    });
  }

  addConsoleHistoryMessage(message?: string, error?: string): void {
    const { consoleHistory } = this.state;
    const historyItem = {
      startTime: Date.now(),
      endTime: Date.now(),
      result: { message, error },
    };
    const history = consoleHistory.concat(historyItem);
    this.setState({
      consoleHistory: history,
    });
  }

  handleCsvUpdate(message: string): void {
    this.addConsoleHistoryMessage(message);
  }

  handleCsvError(error: unknown): void {
    this.addConsoleHistoryMessage(
      undefined,
      error != null ? `${error}` : undefined
    );
  }

  handleCsvInProgress(csvUploadInProgress: boolean): void {
    this.setState({ csvUploadInProgress });
  }

  handleOverflowActions(): DropdownAction[] {
    const {
      isAutoLaunchPanelsEnabled,
      isClosePanelsOnDisconnectEnabled,
      isPrintStdOutEnabled,
    } = this.state;
    const { actions } = this.props;
    return [
      ...actions,
      {
        title: 'Print Stdout',
        action: this.handleTogglePrintStdout,
        group: ContextActions.groups.high,
        icon: isPrintStdOutEnabled ? vsCheck : undefined,
        order: 10,
      },
      {
        title: 'Auto Launch Panels',
        action: this.handleToggleAutoLaunchPanels,
        group: ContextActions.groups.high,
        icon: isAutoLaunchPanelsEnabled ? vsCheck : undefined,
        order: 20,
      },
      {
        title: 'Close Panels on Disconnect',
        action: this.handleToggleClosePanelsOnDisconnect,
        group: ContextActions.groups.high,
        icon: isClosePanelsOnDisconnectEnabled ? vsCheck : undefined,
        order: 30,
      },
      {
        title: 'Upload Table from File',
        action: this.handleUploadCsv,
        group: ContextActions.groups.high + 10,
        order: 40,
      },
    ];
  }

  handleCommandSubmit(command: string): void {
    if (command === 'clear' || command === 'cls') {
      this.clearConsoleHistory();
    } else if (command.length > 0) {
      // Result is handled in this.handleCommandStarted
      const { session } = this.props;
      session.runCode(command).catch(error => {
        log.error('There was an error initiating the command', error);
      });
    } else {
      // Empty command, just pump a blank line out to history
      const historyItem = {
        command: ' ',
        result: {},
        startTime: Date.now(),
        endTime: Date.now(),
      };

      this.scrollConsoleHistoryToBottom(true);

      this.setState(state => ({
        consoleHistory: state.consoleHistory.concat(historyItem),
      }));
    }
  }

  clearConsoleHistory(): void {
    this.pending.cancel();

    this.setState(state => {
      // Replace all values with -1 to indicate that table references are still active
      // but don't have corresponding command indexes in consoleHistory
      const objectHistoryMap = new Map(
        [...state.objectHistoryMap.keys()].map(name => [name, -1])
      );
      return { consoleHistory: [], objectHistoryMap };
    });
  }

  getObjects = memoize((objectMap: Map<string, VariableDefinition>) => [
    ...objectMap.values(),
  ]);

  getContextActions = memoize((actions: DropdownAction[]) => [
    ...actions,
    {
      action: this.handleClearShortcut,
      shortcut: SHORTCUTS.CONSOLE.CLEAR,
    },
    {
      action: this.handleFocusHistory,
      shortcut: SHORTCUTS.CONSOLE.FOCUS_HISTORY,
    },
  ]);

  addCommand(command: string, focus = true, execute = false): void {
    if (!this.consoleInput.current) {
      return;
    }
    this.consoleInput.current.setConsoleText(command, focus, execute);

    if (focus) {
      this.scrollConsoleHistoryToBottom(true);
    }
  }

  focus(): void {
    this.consoleInput.current?.focus();
  }

  sendSettingsChange(
    prevState: ConsoleState,
    state: ConsoleState,
    checkIfChanged = true
  ): void {
    const keys = Object.keys(DEFAULT_SETTINGS) as Array<keyof Settings>;
    const settings: Record<string, unknown> = {};
    let hasChanges = false;
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const { [key]: setting } = state;
      const { [key]: prevSetting } = prevState;
      if (setting !== prevSetting) {
        hasChanges = true;
      }
      settings[key] = setting;
    }
    if (checkIfChanged && !hasChanges) {
      return;
    }
    const { onSettingsChange } = this.props;
    onSettingsChange(settings);
  }

  updateDimensions(): void {
    if (this.consolePane.current) {
      this.setState({
        consoleHeight: this.consolePane.current.clientHeight,
      });
    }
    if (this.consoleInput.current) {
      this.consoleInput.current.updateDimensions();
    }
  }

  render(): ReactElement {
    const {
      actions,
      dh,
      historyChildren,
      language,
      statusBarChildren,
      openObject,
      session,
      scope,
      commandHistoryStorage,
      timeZone,
      disabled,
      unzip,
      supportsType,
      iconForType,
    } = this.props;
    const {
      consoleHeight,
      consoleHistory,
      isScrollDecorationShown,
      objectMap,
      showCsvOverlay,
      csvFile,
      csvPaste,
      dragError,
      csvUploadInProgress,
    } = this.state;
    const consoleMenuObjects = this.getObjects(objectMap);
    const inputMaxHeight = Math.round(consoleHeight * 0.7);
    const contextActions = this.getContextActions(actions);

    return (
      <div
        role="presentation"
        className={classNames('iris-console', 'h-100', 'w-100', { disabled })}
      >
        <div className="console-pane" ref={this.consolePane}>
          <ConsoleStatusBar
            dh={dh}
            session={session}
            overflowActions={this.handleOverflowActions}
            openObject={openObject}
            objects={consoleMenuObjects}
          >
            {statusBarChildren}
          </ConsoleStatusBar>
          <div
            className="console-csv-container"
            onDragOver={CsvOverlay.handleDragOver}
            onDragEnter={this.handleDragEnter}
            onDragLeave={this.handleDragLeave}
          >
            {showCsvOverlay && (
              <CsvOverlay
                onCancel={this.handleCsvFileCanceled}
                onFileOpened={this.handleCsvFileOpened}
                onPaste={this.handleCsvPaste}
                clearDragError={this.handleClearDragError}
                dragError={dragError}
                onError={this.handleCsvError}
                uploadInProgress={csvUploadInProgress}
                allowZip={unzip != null}
              />
            )}
            <div
              role="presentation"
              className={classNames('scroll-pane no-scroll-x', {
                'scroll-decoration': isScrollDecorationShown,
              })}
              onScroll={this.handleScrollPaneScroll}
              ref={this.consoleHistoryScrollPane}
            >
              <ConsoleHistory
                items={consoleHistory}
                openObject={openObject}
                language={language}
                disabled={disabled}
                supportsType={supportsType}
                iconForType={iconForType}
              />
              {historyChildren}
            </div>
          </div>
          {!showCsvOverlay && (
            <ConsoleInput
              ref={this.consoleInput}
              session={session}
              language={language}
              scope={scope}
              onSubmit={this.handleCommandSubmit}
              maxHeight={inputMaxHeight}
              commandHistoryStorage={commandHistoryStorage}
            />
          )}
          {showCsvOverlay && (
            <CsvInputBar
              session={session}
              onOpenTable={this.handleOpenCsvTable}
              onClose={this.handleHideCsv}
              onUpdate={this.handleCsvUpdate}
              onError={this.handleCsvError}
              file={csvFile ?? undefined}
              paste={csvPaste ?? undefined}
              onInProgress={this.handleCsvInProgress}
              timeZone={timeZone}
              unzip={unzip}
            />
          )}
        </div>
        <ContextActions
          actions={contextActions}
          ignoreClassNames={[ConsoleInput.INPUT_CLASS_NAME]}
        />
      </div>
    );
  }
}

export default Console;
