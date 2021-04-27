import shortid from 'shortid';
import Log from '@deephaven/log';
import { ConsoleEvent } from '../events';
import LayoutUtils from '../../layout/LayoutUtils';
import { CommandHistoryPanel, ConsolePanel, LogPanel } from '../panels';

const log = Log.module('ConsoleEventHandler');

class ConsoleEventHandler {
  constructor(layout, panelManager, onSettingsChanged) {
    this.layout = layout;
    this.panelManager = panelManager;
    this.onSettingsChanged = onSettingsChanged;

    this.handleSendCommand = this.handleSendCommand.bind(this);
    this.handleSettingsChanged = this.handleSettingsChanged.bind(this);
    this.handleDisconnectSession = this.handleDisconnectSession.bind(this);
    this.handleRestartSession = this.handleRestartSession.bind(this);

    this.startListening();
    this.addMissingPanels();
    this.activateConsolePanel();
  }

  getStackForComponentType(component) {
    const config = { component };
    return LayoutUtils.getStackForRoot(
      this.layout.root,
      config,
      false,
      true,
      false
    );
  }

  getConsoleStack() {
    return this.getStackForComponentType(ConsolePanel.COMPONENT);
  }

  getConsolePanel() {
    return this.panelManager.getLastUsedPanelOfType(ConsolePanel);
  }

  activateConsolePanel() {
    const consoleStack = this.getConsoleStack();
    if (!consoleStack) {
      return;
    }
    const config = { component: ConsolePanel.COMPONENT };
    LayoutUtils.activateTab(consoleStack, config);
  }

  /**
   * All panels should normally be a part of config used to initialize the layout
   * This method adds panels if they are missing in the layout config
   */
  addMissingPanels() {
    const consoleStack = this.getConsoleStack();
    if (!consoleStack) {
      return;
    }

    const panels = [CommandHistoryPanel];
    const componentTypes = panels.map(panel => panel.COMPONENT);

    const stack = LayoutUtils.getStackForComponentTypes(
      this.layout.root,
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
          this.layout.root,
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

    const logStack = this.getStackForComponentType(LogPanel.COMPONENT);

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
  }

  handleSendCommand(command, focus = true, execute = false) {
    const trimmedCommand = command && command.trim();
    if (!trimmedCommand) {
      log.info('Ignoring empty code');
    } else {
      const consolePanel = this.getConsolePanel();
      if (!consolePanel) {
        log.error('Console panel not found');
        return;
      }
      log.debug('Send command: ', command, focus, execute);
      consolePanel.addCommand(command, focus, execute);
    }
  }

  handleSettingsChanged(consoleCreatorSettings, consoleSettings) {
    log.debug('Settings changed', consoleCreatorSettings, consoleSettings);
    this.onSettingsChanged({ consoleCreatorSettings, consoleSettings });
  }

  handleDisconnectSession() {
    const consolePanel = this.getConsolePanel();
    if (consolePanel && consolePanel.consoleContainerRef) {
      consolePanel.consoleContainerRef.closeSessionAndUpdateState();
    }
  }

  handleRestartSession() {
    const consolePanel = this.getConsolePanel();
    if (consolePanel && consolePanel.consoleContainerRef) {
      consolePanel.consoleContainerRef.restartSession();
    }
  }

  startListening() {
    const { eventHub } = this.layout;
    eventHub.on(ConsoleEvent.SEND_COMMAND, this.handleSendCommand);
    eventHub.on(ConsoleEvent.SETTINGS_CHANGED, this.handleSettingsChanged);
    eventHub.on(ConsoleEvent.DISCONNECT_SESSION, this.handleDisconnectSession);
    eventHub.on(ConsoleEvent.RESTART_SESSION, this.handleRestartSession);
  }

  stopListening() {
    const { eventHub } = this.layout;
    eventHub.off(ConsoleEvent.SEND_COMMAND, this.handleSendCommand);
    eventHub.off(ConsoleEvent.SETTINGS_CHANGED, this.handleSettingsChanged);
    eventHub.off(ConsoleEvent.DISCONNECT_SESSION, this.handleDisconnectSession);
    eventHub.off(ConsoleEvent.RESTART_SESSION, this.handleRestartSession);
  }
}

export default ConsoleEventHandler;
