import Log from '@deephaven/log';
import { string } from 'prop-types';
import React, { ComponentType, useCallback, useEffect } from 'react';
import shortid from 'shortid';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import { ConsoleEvent } from '../../dashboard/events';
import {
  ConsolePanel,
  CommandHistoryPanel,
  FileExplorerPanel,
  LogPanel,
  NotebookPanel,
} from '../../dashboard/panels';
import LayoutUtils from '../../layout/LayoutUtils';

const log = Log.module('ConsolePlugin');

export const ConsolePlugin = ({
  id,
  layout,
  panelManager,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
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
    () => panelManager.getLastUsedPanelOfType(ConsolePanel),
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

  /**
   * All panels should normally be a part of config used to initialize the layout
   * This method adds panels if they are missing in the layout config
   */
  const addMissingPanels = useCallback(() => {
    const consoleStack = getConsoleStack();
    if (!consoleStack) {
      return;
    }

    const panels = [CommandHistoryPanel, FileExplorerPanel];
    const componentTypes = panels.map(panel => panel.COMPONENT);

    const stack = LayoutUtils.getStackForComponentTypes(
      layout.root,
      componentTypes
    );

    const activeItem = stack.getActiveContentItem();
    let itemsAdded = false;

    panels.forEach(panel => {
      const component = panel.COMPONENT;
      const title = panel.TITLE;
      // getContentItemInStack wouldn't work because panels in the layout config can be in separate stacks
      if (
        // Look for stack with matching component type, don't allow empty and don't create new
        !LayoutUtils.getStackForComponentTypes(
          layout.root,
          [component],
          false,
          true,
          false
        )
      ) {
        itemsAdded = true;
        log.debug(`${component} not found - creating new`);
        const config = {
          component,
          isClosable: false,
          props: { metadata: {} },
          title,
          type: 'react-component',
        };
        stack.addChild(config);
      }
    });

    if (itemsAdded) {
      // Last added item becomes active, restore activeItem
      // Fall back to first item in stack
      stack.setActiveContentItem(
        activeItem != null ? activeItem : stack.contentItems[0]
      );
    }

    const logStack = getStackForComponentType(LogPanel.COMPONENT);

    if (!logStack) {
      log.debug('LogPanel not found - creating new');
      const config = {
        component: LogPanel.COMPONENT,
        isClosable: false,
        title: LogPanel.TITLE,
        type: 'react-component',
        props: { session: null },
        id: shortid.generate(),
      };
      consoleStack.addChild(config);
    }
  }, [getConsoleStack, getStackForComponentType, layout]);

  const handleSendCommand = useCallback(
    (command = string, focus = true, execute = true) => {
      const trimmedCommand = command && command.trim();
      if (!trimmedCommand) {
        log.info('Ignoring empty code');
      } else {
        const consolePanel = getConsolePanel();
        if (!consolePanel) {
          log.error('Console panel not found');
          return;
        }
        log.debug('Send command: ', command, focus, execute);
        consolePanel.addCommand(command, focus, execute);
      }
    },
    [getConsolePanel]
  );

  const handleSettingsChanged = useCallback(() => {
    // TODO: needs to store data with the dashboard itself
    log.warn('handleSettingsChanged not implemented yet!!');
  }, []);

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
    addMissingPanels();
    activateConsolePanel();
  }, [activateConsolePanel, addMissingPanels]);

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
