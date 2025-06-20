// Wrapper for the Console for use in a golden layout container
// Will probably need to handle window popping out from golden layout here.
import React, { PureComponent, type ReactElement, type RefObject } from 'react';
import { nanoid } from 'nanoid';
import debounce from 'lodash.debounce';
import { connect } from 'react-redux';
import { LoadingOverlay } from '@deephaven/components';
import {
  type CommandHistoryStorage,
  Console,
  ConsoleConstants,
  HeapUsage,
  ObjectIcon,
} from '@deephaven/console';
import {
  type DashboardPanelProps,
  emitCloseDashboard,
  emitPanelOpen,
  LayoutManagerContext,
  LayoutUtils,
  PanelEvent,
} from '@deephaven/dashboard';
import type { dh } from '@deephaven/jsapi-types';
import { getVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import { type SessionWrapper } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
  getCommandHistoryStorage,
  getPlugins,
  getTimeZone,
  type RootState,
} from '@deephaven/redux';
import { assertNotNull } from '@deephaven/utils';
import {
  getIconForPlugin,
  pluginSupportsType,
  type PluginModuleMap,
} from '@deephaven/plugin';
import type { JSZipObject } from 'jszip';
import { ConsoleEvent } from '../events';
import Panel from './CorePanel';
import { getDashboardSessionWrapper } from '../redux';
import './ConsolePanel.scss';

const log = Log.module('ConsolePanel');

const DEBOUNCE_PANEL_STATE_UPDATE = 500;

const DEFAULT_PANEL_STATE = Object.freeze({
  consoleSettings: {},
  itemIds: [],
});

interface ConsoleSettings {
  isClosePanelsOnDisconnectEnabled?: boolean;
}

interface PanelState {
  consoleSettings: ConsoleSettings;
  itemIds: [string, string][];
}

type ItemIds = Map<string, string>;

interface ConsolePanelProps extends DashboardPanelProps {
  commandHistoryStorage: CommandHistoryStorage;

  panelState?: PanelState;

  sessionWrapper?: SessionWrapper;

  timeZone: string;
  unzip?: (file: File) => Promise<JSZipObject[]>;
  plugins: PluginModuleMap;
}

interface ConsolePanelState {
  consoleSettings: ConsoleSettings;
  itemIds: ItemIds;

  objectMap: Map<string, dh.ide.VariableDefinition>;

  // eslint-disable-next-line react/no-unused-state
  panelState: PanelState;
  error: unknown;
}

export class ConsolePanel extends PureComponent<
  ConsolePanelProps,
  ConsolePanelState
> {
  static COMPONENT = 'ConsolePanel';

  static TITLE = 'Console';

  static contextType = LayoutManagerContext;

  constructor(props: ConsolePanelProps) {
    super(props);

    this.handleFocusCommandHistory = this.handleFocusCommandHistory.bind(this);
    this.handleOpenObject = this.handleOpenObject.bind(this);
    this.handleCloseObject = this.handleCloseObject.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleSettingsChange = this.handleSettingsChange.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handlePanelMount = this.handlePanelMount.bind(this);
    this.supportsType = this.supportsType.bind(this);
    this.iconForType = this.iconForType.bind(this);

    this.consoleRef = React.createRef();

    const { panelState: initialPanelState } = props;
    const panelState = {
      ...DEFAULT_PANEL_STATE,
      ...(initialPanelState || {}),
    };
    const { consoleSettings, itemIds } = panelState;

    this.state = {
      consoleSettings,
      itemIds: new Map(itemIds),

      objectMap: new Map(),
      error: undefined,
      // eslint-disable-next-line react/no-unused-state
      panelState, // Dehydrated panel state that can load this panel
    };
  }

  componentDidMount(): void {
    const { glEventHub } = this.props;
    // Need to close the disconnected panels when we're first loaded,
    // as they may have been saved with the dashboard
    this.closeDisconnectedPanels();
    glEventHub.on(PanelEvent.MOUNT, this.handlePanelMount);
    this.subscribeToFieldUpdates();
  }

  componentDidUpdate(
    prevProps: ConsolePanelProps,
    prevState: ConsolePanelState
  ): void {
    const { consoleSettings, itemIds } = this.state;
    if (
      prevState.consoleSettings !== consoleSettings ||
      prevState.itemIds !== itemIds
    ) {
      this.savePanelState();
    }
  }

  componentWillUnmount(): void {
    const { glEventHub } = this.props;
    this.savePanelState.flush();
    glEventHub.off(PanelEvent.MOUNT, this.handlePanelMount);
    this.objectSubscriptionCleanup?.();
  }

  consoleRef: RefObject<Console>;

  objectSubscriptionCleanup?: () => void;

  subscribeToFieldUpdates(): void {
    const { sessionWrapper } = this.props;
    if (sessionWrapper == null) {
      return;
    }

    const { session } = sessionWrapper;

    this.objectSubscriptionCleanup = session.subscribeToFieldUpdates(
      updates => {
        log.debug('Got updates', updates);
        this.setState(({ objectMap }) => {
          const { updated, created, removed } = updates;

          // Remove from the array if it's been removed OR modified. We'll add it back after if it was modified.
          const objectsToRemove = [...updated, ...removed];
          const newObjectMap = new Map(objectMap);
          objectsToRemove.forEach(toRemove => {
            const { title } = toRemove;
            if (title !== undefined) {
              newObjectMap.delete(title);
            }
          });

          // Now add all the modified and updated widgets back in
          const objectsToAdd = [...updated, ...created];
          objectsToAdd.forEach(toAdd => {
            if (toAdd.title !== undefined) {
              newObjectMap.set(toAdd.title, toAdd);
            }
          });

          return { objectMap: newObjectMap };
        });
      }
    );
  }

  setItemId(name: string, id: string): void {
    this.setState(({ itemIds }) => {
      const newItemIds = new Map(itemIds);
      newItemIds.set(name, id);
      return { itemIds: newItemIds };
    });
  }

  getItemId(name: string, createIfNecessary = true): string | undefined {
    const { itemIds } = this.state;
    let id = itemIds.get(name);
    if (id == null && createIfNecessary) {
      id = nanoid();
      this.setItemId(name, id);
    }
    return id;
  }

  handleTabFocus(): void {
    this.consoleRef.current?.focus();
  }

  handlePanelMount(panel: {
    props: { id: string; metadata: { sourcePanelId: string } };
  }): void {
    const { itemIds } = this.state;
    const panelId = panel?.props?.id;
    const sourceId = panel?.props?.metadata?.sourcePanelId;
    if (panelId && sourceId) {
      // Check if the panel was created from a panel in this console
      const pandelIds = new Set(itemIds.values());
      if (pandelIds.has(sourceId)) {
        // The Chart Panel does not have name so map panelId to panelId
        this.setItemId(panelId, panelId);
      }
    }
  }

  handleFocusCommandHistory(): void {
    const { glEventHub } = this.props;
    glEventHub.emit(ConsoleEvent.FOCUS_HISTORY);
  }

  handleResize(): void {
    this.updateDimensions();
  }

  handleShow(): void {
    this.updateDimensions();
  }

  handleOpenObject(
    object: dh.ide.VariableDescriptor & { title?: string },
    forceOpen = true
  ): void {
    const { root } = this.context;
    const oldPanelId =
      object.title != null ? this.getItemId(object.title, false) : null;
    if (
      forceOpen ||
      (oldPanelId != null &&
        LayoutUtils.getStackForRoot(
          root,
          { id: oldPanelId },
          false,
          false,
          false
        ) != null)
    ) {
      this.openWidget(object);
    }
  }

  handleCloseObject(object: dh.ide.VariableDefinition): void {
    const { title } = object;
    if (title !== undefined) {
      const id = this.getItemId(title, false);
      if (id != null) {
        const { glEventHub } = this.props;
        glEventHub.emit(PanelEvent.CLOSE, id);
        // Just emit for all panels since there shouldn't be dashboard and panel name conflicts
        emitCloseDashboard(glEventHub, title);
      }
    }
  }

  handleSettingsChange(consoleSettings: Record<string, unknown>): void {
    const { glEventHub } = this.props;
    log.debug('handleSettingsChange', consoleSettings);
    this.setState({
      consoleSettings,
    });
    glEventHub.emit(ConsoleEvent.SETTINGS_CHANGED, consoleSettings);
  }

  /**
   * @param widget The widget to open
   */
  openWidget(widget: dh.ide.VariableDescriptor & { title?: string }): void {
    const { glEventHub, sessionWrapper } = this.props;
    assertNotNull(sessionWrapper);

    const { config, session } = sessionWrapper;
    const { title = widget.name } = widget;
    assertNotNull(title);
    const panelId = this.getItemId(title);
    const openOptions = {
      fetch: () => session.getObject(widget),
      panelId,
      widget: {
        ...getVariableDescriptor(widget),
        sessionId: config.id,
      },
    };

    log.debug('openWidget', openOptions);

    emitPanelOpen(glEventHub, openOptions);
  }

  addCommand(command: string, focus = true, execute = false): void {
    this.consoleRef.current?.addCommand(command, focus, execute);
  }

  /**
   * Close the disconnected panels from this session
   * @param force True to force the panels closed regardless of the current setting
   */
  closeDisconnectedPanels(force = false): void {
    const { consoleSettings, itemIds } = this.state;
    const { isClosePanelsOnDisconnectEnabled = true } = consoleSettings;
    if (!isClosePanelsOnDisconnectEnabled && !force) {
      return;
    }

    const panelIdsToClose = [...itemIds.values()];
    const { glEventHub } = this.props;
    panelIdsToClose.forEach(panelId => {
      glEventHub.emit(PanelEvent.CLOSE, panelId);
    });

    this.setState({ itemIds: new Map() });
  }

  savePanelState = debounce((): void => {
    const { consoleSettings, itemIds } = this.state;
    const panelState = {
      consoleSettings,
      itemIds: [...itemIds],
    };
    log.debug('Saving panel state', panelState);
    // eslint-disable-next-line react/no-unused-state
    this.setState({ panelState });
  }, DEBOUNCE_PANEL_STATE_UPDATE);

  updateDimensions(): void {
    this.consoleRef.current?.updateDimensions();
  }

  supportsType(type: string): boolean {
    const { plugins } = this.props;
    return [...plugins.values()].some(plugin =>
      pluginSupportsType(plugin, type)
    );
  }

  iconForType(type: string): JSX.Element {
    const { plugins } = this.props;
    const plugin = [...plugins.values()].find(p => pluginSupportsType(p, type));
    if (plugin != null) {
      return getIconForPlugin(plugin);
    }
    // TODO: #1573 Remove this default and always return getIconForPlugin
    return <ObjectIcon type={type} />;
  }

  render(): ReactElement | null {
    const {
      commandHistoryStorage,
      glContainer,
      glEventHub,
      sessionWrapper,
      timeZone,
      unzip,
    } = this.props;

    if (sessionWrapper == null) {
      return (
        <LoadingOverlay isLoading={false} errorMessage="Console is disabled." />
      );
    }

    const { consoleSettings, error, objectMap } = this.state;
    const { config, session, connection, details = {}, dh } = sessionWrapper;
    const { workerName, processInfoId } = details;
    const { id: sessionId, type: language } = config;

    return (
      <Panel
        className="iris-panel-console"
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onResize={this.handleResize}
        onShow={this.handleShow}
        onTabFocus={this.handleTabFocus}
        errorMessage={error != null ? `${error}` : undefined}
      >
        {session != null && (
          <Console
            dh={dh}
            ref={this.consoleRef}
            settings={consoleSettings}
            session={session}
            focusCommandHistory={this.handleFocusCommandHistory}
            openObject={this.handleOpenObject}
            closeObject={this.handleCloseObject}
            commandHistoryStorage={commandHistoryStorage}
            onSettingsChange={this.handleSettingsChange}
            language={language}
            statusBarChildren={
              <>
                <div>{ConsoleConstants.LANGUAGE_MAP.get(language)}</div>
                {workerName != null && (
                  <>
                    <div>•</div>
                    {workerName}
                  </>
                )}
                {processInfoId != null && (
                  <>
                    <div>•</div>
                    {processInfoId}
                    <div>•</div>
                  </>
                )}
                <HeapUsage
                  connection={connection}
                  defaultUpdateInterval={10 * 1000}
                  hoverUpdateInterval={3 * 1000}
                  monitorDuration={10 * 60 * 1000}
                />
              </>
            }
            showObjectsMenu={false}
            scope={sessionId}
            timeZone={timeZone}
            objectMap={objectMap}
            unzip={unzip}
            supportsType={this.supportsType}
            iconForType={this.iconForType}
          />
        )}
      </Panel>
    );
  }
}

const mapStateToProps = (
  state: RootState,
  ownProps: { localDashboardId: string }
): Pick<
  ConsolePanelProps,
  'commandHistoryStorage' | 'sessionWrapper' | 'timeZone' | 'plugins'
> => ({
  commandHistoryStorage: getCommandHistoryStorage(
    state
  ) as CommandHistoryStorage,
  sessionWrapper: getDashboardSessionWrapper(state, ownProps.localDashboardId),
  timeZone: getTimeZone(state),
  plugins: getPlugins(state),
});

const ConnectedConsolePanel = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(ConsolePanel);

export default ConnectedConsolePanel;
