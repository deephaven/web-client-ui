/**
 * Console display for use in the Iris environment.
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ContextActions } from '@deephaven/components';
import { vsCheck } from '@deephaven/icons';
import classNames from 'classnames';
import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import dh, { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import { Pending } from '@deephaven/utils';
import ConsoleHistory from './console-history/ConsoleHistory';
import SHORTCUTS from './ConsoleShortcuts';
import LogLevel from './log/LogLevel';
import ConsoleInput from './ConsoleInput';
import CsvOverlay from './csv/CsvOverlay';
import CsvInputBar from './csv/CsvInputBar';
import './Console.scss';
import ConsoleStatusBar from './ConsoleStatusBar';
import StoragePropTypes from './StoragePropTypes';

const log = Log.module('Console');

const DEFAULT_SETTINGS = {
  isAutoLaunchPanelsEnabled: true,
  isPrintStdOutEnabled: true,
  isClosePanelsOnDisconnectEnabled: true,
};

export class Console extends PureComponent {
  static LOG_THROTTLE = 500;

  /**
   * Check if the provided log level is an error type
   * @param {LogLevel} logLevel The LogLevel being checked
   * @returns {boolean} true if the log level is an error level log
   */
  static isErrorLevel(logLevel) {
    return (
      logLevel === LogLevel.STDERR ||
      logLevel === LogLevel.ERROR ||
      logLevel === LogLevel.FATAL
    );
  }

  /**
   * Check if the provided log level is output level
   * @param {LogLevel} logLevel The LogLevel being checked
   * @returns {boolean} true if the log level should be output to the console
   */
  static isOutputLevel(logLevel) {
    // We want all errors to be output, in addition to STDOUT.
    // That way the user is more likely to see them.
    return logLevel === LogLevel.STDOUT || Console.isErrorLevel(logLevel);
  }

  constructor(props) {
    super(props);

    this.handleCommandResult = this.handleCommandResult.bind(this);
    this.handleCommandStarted = this.handleCommandStarted.bind(this);
    this.handleCommandSubmit = this.handleCommandSubmit.bind(this);
    this.handleClearShortcut = this.handleClearShortcut.bind(this);
    this.handleFocusHistory = this.handleFocusHistory.bind(this);
    this.handleLogMessage = this.handleLogMessage.bind(this);
    this.handleOverflowActions = this.handleOverflowActions.bind(this);
    this.handleScrollPaneScroll = this.handleScrollPaneScroll.bind(this);
    this.handleToggleAutoLaunchPanels = this.handleToggleAutoLaunchPanels.bind(
      this
    );
    this.handleToggleClosePanelsOnDisconnect = this.handleToggleClosePanelsOnDisconnect.bind(
      this
    );
    this.handleTogglePrintStdout = this.handleTogglePrintStdout.bind(this);
    this.processLogMessageQueue = throttle(
      this.processLogMessageQueue.bind(this),
      Console.LOG_THROTTLE
    );
    this.handleUploadCsv = this.handleUploadCsv.bind(this);
    this.handleHideCsv = this.handleHideCsv.bind(this);
    this.handleCsvFileOpened = this.handleCsvFileOpened.bind(this);
    this.handleCsvPaste = this.handleCsvPaste.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleClearDragError = this.handleClearDragError.bind(this);
    this.handleOpenCsvTable = this.handleOpenCsvTable.bind(this);
    this.handleCsvUpdate = this.handleCsvUpdate.bind(this);
    this.handleCsvError = this.handleCsvError.bind(this);
    this.handleCsvInProgress = this.handleCsvInProgress.bind(this);

    this.cancelListener = null;
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

  componentDidMount() {
    this.initConsoleLogging();

    const { session } = this.props;
    session.addEventListener(
      dh.IdeSession.EVENT_COMMANDSTARTED,
      this.handleCommandStarted
    );

    this.updateDimensions();
  }

  componentDidUpdate(prevProps, prevState) {
    const { props, state } = this;
    this.sendSettingsChange(prevState, state);

    if (props.objectMap !== prevProps.objectMap) {
      this.updateObjectMap();
    }
  }

  componentWillUnmount() {
    const { session } = this.props;

    session.removeEventListener(
      dh.IdeSession.EVENT_COMMANDSTARTED,
      this.handleCommandStarted
    );

    this.pending.cancel();
    this.processLogMessageQueue.cancel();

    this.deinitConsoleLogging();
  }

  initConsoleLogging() {
    const { session } = this.props;
    this.cancelListener = session.onLogMessage(this.handleLogMessage);
  }

  deinitConsoleLogging() {
    if (this.cancelListener != null) {
      this.cancelListener();
      this.cancelListener = null;
    }
  }

  handleClearShortcut(event) {
    event.preventDefault();
    event.stopPropagation();

    this.consoleInput.current.clear();
  }

  handleCommandStarted(event) {
    const { code, result } = event.detail;
    const wrappedResult = this.pending.add(result);
    const historyItem = {
      command: code,
      result: null,
      disabledObjects: [],
      startTime: Date.now(),
      endTime: null,
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
        endTime: null,
        result: null,
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

  handleCommandResult(result, historyItemParam, workspaceItemPromise) {
    const historyItem = historyItemParam;
    historyItem.wrappedResult = null;
    historyItem.cancelResult = null;

    if (!result) {
      return;
    }

    historyItem.result = result;

    this.updateHistory(result, historyItem);
    this.updateKnownObjects(historyItem);
    this.updateWorkspaceHistoryItem(
      { error: result.error },
      workspaceItemPromise
    );

    this.closeRemovedItems(result.changes);
    this.openUpdatedItems(result.changes);
  }

  handleCommandError(error, historyItemParam, workspaceItemPromise) {
    const historyItem = historyItemParam;
    historyItem.wrappedResult = null;
    historyItem.cancelResult = null;

    if (error && error.isCanceled) {
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
      historyItem.endTime = Date.now();
      historyItem.result = { error };
      history[index] = { ...historyItem };
      return {
        consoleHistory: history,
      };
    });
  }

  handleFocusHistory(event) {
    event.preventDefault();
    event.stopPropagation();

    const { focusCommandHistory } = this.props;
    focusCommandHistory();
  }

  handleLogMessage(message) {
    const { isPrintStdOutEnabled } = this.state;
    if (!isPrintStdOutEnabled) {
      return;
    }

    if (Console.isOutputLevel(message.logLevel)) {
      this.queueLogMessage(message.message, message.logLevel);
    }
  }

  queueLogMessage(message, logLevel) {
    const result = {};
    if (Console.isErrorLevel(logLevel)) {
      result.error = message;
    } else {
      result.message = message;
    }

    const historyItem = { command: null, result };

    this.queuedLogMessages.push(historyItem);

    this.processLogMessageQueue();
  }

  processLogMessageQueue() {
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
  }

  openUpdatedItems(changes) {
    const { isAutoLaunchPanelsEnabled } = this.state;
    if (!changes || !isAutoLaunchPanelsEnabled) {
      return;
    }

    const { openObject } = this.props;
    [...changes.created, ...changes.updated].forEach(object =>
      openObject(object)
    );
  }

  closeRemovedItems(changes) {
    if (!changes || !changes.removed || changes.removed.length === 0) {
      return;
    }

    const { closeObject } = this.props;
    const { removed } = changes;
    removed.forEach(object => closeObject(object));
  }

  updateHistory(result, historyItemParam) {
    const historyItem = historyItemParam;
    if (!result || !result.changes || !historyItem) {
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

  updateKnownObjects(historyItem) {
    const { changes } = historyItem.result;
    if (
      !changes ||
      ((!changes.created || changes.created.length === 0) &&
        (!changes.updated || changes.updated.length === 0) &&
        (!changes.removed || changes.removed.length === 0))
    ) {
      log.debug2('updateKnownObjects no changes');
      return;
    }

    this.setState(state => {
      const history = state.consoleHistory.concat();
      const itemIndex = history.lastIndexOf(historyItem);
      if (itemIndex < 0) {
        log.error(`historyItem not found in state.consoleHistory`);
        return null;
      }

      const objectHistoryMap = new Map(state.objectHistoryMap);
      const objectMap = new Map(state.objectMap);

      const disableOldObject = (object, isRemoved = false) => {
        const { name } = object;
        const oldIndex = objectHistoryMap.get(name);
        // oldIndex can be -1 if a object is active but doesn't have a command in consoleHistory
        // this can happen after clearing the console using 'clear' or 'cls' command
        if (oldIndex >= 0) {
          // disable outdated object variable in the old consoleHistory item
          history[oldIndex].disabledObjects = history[
            oldIndex
          ].disabledObjects.concat(name);
          history[oldIndex] = { ...history[oldIndex] };
        }
        objectHistoryMap.set(name, itemIndex);
        if (isRemoved) {
          objectMap.delete(name);
        } else {
          objectMap.set(name, object);
        }
      };

      changes.updated.forEach(object => disableOldObject(object));
      changes.removed.forEach(object => disableOldObject(object, true));

      // Created objects have to be processed after removed
      // in case the same object name is present in both removed and created
      changes.created.forEach(object => {
        const { name } = object;
        objectHistoryMap.set(name, itemIndex);
        objectMap.set(name, object);
      });

      return { objectHistoryMap, objectMap, consoleHistory: history };
    });
  }

  updateObjectMap() {
    const { objectMap } = this.props;
    this.setState({ objectMap });
  }

  /**
   * Updates an existing workspace CommandHistoryItem
   * @param {object} result The result to store with the history item. Could be empty object for success
   * @param {Promise<object>} workspaceItemPromise The workspace data row promise for the workspace item to be updated
   */
  updateWorkspaceHistoryItem(result, workspaceItemPromise) {
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

  scrollConsoleHistoryToBottom(force = false) {
    const pane = this.consoleHistoryScrollPane.current;
    if (!force && pane.scrollTop < pane.scrollHeight - pane.offsetHeight) {
      return;
    }

    window.requestAnimationFrame(() => {
      pane.scrollTop = pane.scrollHeight;
    });
  }

  handleScrollPaneScroll() {
    const scrollPane = this.consoleHistoryScrollPane.current;
    if (
      scrollPane.scrollTop > 0 &&
      scrollPane.scrollHeight > scrollPane.clientHeight
    ) {
      this.setState({ isScrollDecorationShown: true });
    } else {
      this.setState({ isScrollDecorationShown: false });
    }
  }

  handleToggleAutoLaunchPanels() {
    this.setState(state => ({
      isAutoLaunchPanelsEnabled: !state.isAutoLaunchPanelsEnabled,
    }));
  }

  handleToggleClosePanelsOnDisconnect() {
    this.setState(state => ({
      isClosePanelsOnDisconnectEnabled: !state.isClosePanelsOnDisconnectEnabled,
    }));
  }

  handleTogglePrintStdout() {
    this.setState(state => ({
      isPrintStdOutEnabled: !state.isPrintStdOutEnabled,
    }));
  }

  handleUploadCsv() {
    this.setState({
      showCsvOverlay: true,
      dragError: null,
      csvUploadInProgress: false,
    });
  }

  handleHideCsv() {
    this.setState({
      showCsvOverlay: false,
      csvFile: null,
      csvPaste: null,
      dragError: null,
      csvUploadInProgress: false,
    });
  }

  handleCsvFileOpened(file) {
    this.setState({ csvFile: file, csvPaste: null });
  }

  handleCsvPaste(value) {
    this.setState({ csvFile: null, csvPaste: value });
  }

  handleDragEnter(e) {
    if (
      !e.dataTransfer ||
      !e.dataTransfer.items ||
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

  handleDragLeave(e) {
    // DragLeave gets fired for every child element, so make sure we're actually leaving the drop zone
    if (!e.currentTarget || e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    this.setState({ showCsvOverlay: false, dragError: null });
  }

  handleClearDragError() {
    this.setState({ dragError: null });
  }

  handleOpenCsvTable(name) {
    const { openObject, commandHistoryStorage, language, scope } = this.props;
    const { consoleHistory, objectMap } = this.state;
    const object = { name, type: dh.VariableType.TABLE };
    const isExistingObject = objectMap.has(name);
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
    this.setState({
      consoleHistory: history,
    });
    this.scrollConsoleHistoryToBottom(true);
    this.updateKnownObjects(historyItem);
    openObject({ name, type: dh.VariableType.TABLE });
    commandHistoryStorage.addItem(language, scope, name, {
      command: name,
      startTime: new Date().toJSON(),
      endTime: new Date().toJSON(),
      result: null,
    });
  }

  addConsoleHistoryMessage(message, error) {
    const { consoleHistory } = this.state;
    const historyItem = {
      command: '',
      startTime: Date.now(),
      endTime: Date.now(),
      result: { message, error },
    };
    const history = consoleHistory.concat(historyItem);
    this.setState({
      consoleHistory: history,
    });
  }

  handleCsvUpdate(message) {
    this.addConsoleHistoryMessage(message);
  }

  handleCsvError(error) {
    this.addConsoleHistoryMessage(null, error);
  }

  handleCsvInProgress(csvUploadInProgress) {
    this.setState({ csvUploadInProgress });
  }

  handleOverflowActions() {
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
        icon: isPrintStdOutEnabled ? vsCheck : null,
        order: 10,
      },
      {
        title: 'Auto Launch Panels',
        action: this.handleToggleAutoLaunchPanels,
        group: ContextActions.groups.high,
        icon: isAutoLaunchPanelsEnabled ? vsCheck : null,
        order: 20,
      },
      {
        title: 'Close Panels on Disconnect',
        action: this.handleToggleClosePanelsOnDisconnect,
        group: ContextActions.groups.high,
        icon: isClosePanelsOnDisconnectEnabled ? vsCheck : null,
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

  handleCommandSubmit(command) {
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

  clearConsoleHistory() {
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

  getObjects = memoize(objectMap => [...objectMap.values()]);

  getContextActions = memoize(actions => [
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

  addCommand(command, focus = true, execute = false) {
    if (!this.consoleInput.current) {
      return;
    }
    this.consoleInput.current.setConsoleText(command, focus, execute);

    if (focus) {
      this.scrollConsoleHistoryToBottom(true);
    }
  }

  focus() {
    this.consoleInput.current?.focus();
  }

  sendSettingsChange(prevState, state, checkIfChanged = true) {
    const keys = Object.keys(DEFAULT_SETTINGS);
    const settings = {};
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

  updateDimensions() {
    if (this.consolePane.current) {
      this.setState({
        consoleHeight: this.consolePane.current.clientHeight,
      });
    }
    if (this.consoleInput.current) {
      this.consoleInput.current.updateDimensions();
    }
  }

  render() {
    const {
      actions,
      historyChildren,
      language,
      statusBarChildren,
      openObject,
      session,
      scope,
      commandHistoryStorage,
      timeZone,
      disabled,
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
                onFileOpened={this.handleCsvFileOpened}
                onPaste={this.handleCsvPaste}
                clearDragError={this.handleClearDragError}
                dragError={dragError}
                onError={this.handleCsvError}
                uploadInProgress={csvUploadInProgress}
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
              file={csvFile}
              paste={csvPaste}
              onInProgress={this.handleCsvInProgress}
              timeZone={timeZone}
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

Console.propTypes = {
  statusBarChildren: PropTypes.node,
  settings: PropTypes.shape({}),
  focusCommandHistory: PropTypes.func.isRequired,
  openObject: PropTypes.func.isRequired,
  closeObject: PropTypes.func.isRequired,
  session: APIPropTypes.IdeSession.isRequired,
  language: PropTypes.string.isRequired,
  commandHistoryStorage: StoragePropTypes.CommandHistoryStorage.isRequired,
  onSettingsChange: PropTypes.func,
  scope: PropTypes.string,
  actions: PropTypes.arrayOf(PropTypes.shape({})),
  timeZone: PropTypes.string,

  // Children shown at the bottom of the console history
  historyChildren: PropTypes.node,

  // Known object map
  objectMap: PropTypes.instanceOf(Map),

  disabled: PropTypes.bool,
};

Console.defaultProps = {
  statusBarChildren: null,
  settings: {},
  onSettingsChange: () => {},
  scope: null,
  actions: [],
  historyChildren: null,
  timeZone: 'America/New_York',
  objectMap: new Map(),
  disabled: false,
};

export default Console;
