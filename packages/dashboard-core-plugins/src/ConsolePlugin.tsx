import {
  DashboardPluginComponentProps,
  LayoutUtils,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import React, { ComponentType, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ConsoleEvent } from './events';
import {
  ConsolePanel,
  CommandHistoryPanel,
  FileExplorerPanel,
  LogPanel,
  NotebookPanel,
} from './panels';
import { setDashboardConsoleSettings } from './redux';

const log = Log.module('ConsolePlugin');

export const ConsolePlugin = ({
  id,
  layout,
  panelManager,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const dispatch = useDispatch();
  const getStackForComponentType = useCallback(
    component => {
      const config = { component };
      return LayoutUtils.getStackForRoot(
        layout.root,
        config,
        false,
        true,
        false
      );
    },
    [layout.root]
  );

  const getConsoleStack = useCallback(
    () => getStackForComponentType(ConsolePanel.COMPONENT),
    [getStackForComponentType]
  );

  const getConsolePanel = useCallback(
    () => panelManager.getLastUsedPanelOfType(ConsolePanel.WrappedComponent),
    [panelManager]
  );

  const activateConsolePanel = useCallback(() => {
    const consoleStack = getConsoleStack();
    if (!consoleStack) {
      return;
    }
    const config = { component: ConsolePanel.COMPONENT };
    LayoutUtils.activateTab(consoleStack, config);
  }, [getConsoleStack]);

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

  useEffect(() => {
    activateConsolePanel();
  }, [activateConsolePanel]);

  useEffect(() => {
    layout.eventHub.on(ConsoleEvent.SEND_COMMAND, handleSendCommand);
    layout.eventHub.on(ConsoleEvent.SETTINGS_CHANGED, handleSettingsChanged);
    return () => {
      layout.eventHub.off(ConsoleEvent.SEND_COMMAND, handleSendCommand);
      layout.eventHub.off(ConsoleEvent.SETTINGS_CHANGED, handleSettingsChanged);
    };
  }, [handleSendCommand, handleSettingsChanged, layout.eventHub]);

  return <></>;
};

export default ConsolePlugin;
