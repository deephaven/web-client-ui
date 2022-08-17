// Wrapper for the Console for use in a golden layout container
// Will probably need to handle window popping out from golden layout here.
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import debounce from 'lodash.debounce';
import { connect } from 'react-redux';
import { Console, ConsoleConstants, HeapUsage } from '@deephaven/console';
import { GLPropTypes, PanelEvent } from '@deephaven/dashboard';
import { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import { getCommandHistoryStorage, getTimeZone } from '@deephaven/redux';
import { ConsoleEvent } from '../events';
import './ConsolePanel.scss';
import Panel from './Panel';
import { getDashboardSessionWrapper } from '../redux';

const log = Log.module('ConsolePanel');

const DEBOUNCE_PANEL_STATE_UPDATE = 500;

const DEFAULT_PANEL_STATE = Object.freeze({
  consoleSettings: {},
  itemIds: [],
});

export class ConsolePanel extends PureComponent {
  static COMPONENT = 'ConsolePanel';

  static TITLE = 'Console';

  constructor(props) {
    super(props);

    this.handleFocusCommandHistory = this.handleFocusCommandHistory.bind(this);
    this.handleOpenObject = this.handleOpenObject.bind(this);
    this.handleCloseObject = this.handleCloseObject.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleSettingsChange = this.handleSettingsChange.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handleTabBlur = this.handleTabBlur.bind(this);
    this.handleTabFocus = this.handleTabFocus.bind(this);
    this.handlePanelMount = this.handlePanelMount.bind(this);

    this.savePanelState = debounce(
      this.savePanelState.bind(this),
      DEBOUNCE_PANEL_STATE_UPDATE
    );

    this.consoleRef = React.createRef();
    this.objectSubscriptionCleanup = null;

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

      // eslint-disable-next-line react/no-unused-state
      panelState, // Dehydrated panel state that can load this panel
    };
  }

  componentDidMount() {
    const { glEventHub } = this.props;
    // Need to close the disconnected panels when we're first loaded,
    // as they may have been saved with the dashboard
    this.closeDisconnectedPanels();
    glEventHub.on(PanelEvent.MOUNT, this.handlePanelMount);
    this.subscribeToFieldUpdates();
  }

  componentDidUpdate(prevProps, prevState) {
    const { consoleSettings, itemIds } = this.state;
    if (
      prevState.consoleSettings !== consoleSettings ||
      prevState.itemIds !== itemIds
    ) {
      this.savePanelState();
    }
  }

  componentWillUnmount() {
    const { glEventHub } = this.props;
    this.savePanelState.flush();
    glEventHub.off(PanelEvent.MOUNT, this.handlePanelMount);
    this.objectSubscriptionCleanup();
  }

  subscribeToFieldUpdates() {
    const { sessionWrapper } = this.props;
    const { session } = sessionWrapper;

    this.objectSubscriptionCleanup = session.connection.subscribeToFieldUpdates(
      updates => {
        log.debug('Got updates', updates);
        this.setState(({ objectMap }) => {
          const { updated, created, removed } = updates;

          // Remove from the array if it's been removed OR modified. We'll add it back after if it was modified.
          const objectsToRemove = [...updated, ...removed];
          const newObjectMap = new Map(objectMap);
          objectsToRemove.forEach(toRemove => {
            newObjectMap.delete(toRemove.name);
          });

          // Now add all the modified and updated widgets back in
          const objectsToAdd = [...updated, ...created];
          objectsToAdd.forEach(toAdd => {
            if (toAdd.name) {
              newObjectMap.set(toAdd.name, toAdd);
            }
          });

          return { objectMap: newObjectMap };
        });
      }
    );
  }

  setItemId(name, id) {
    this.setState(({ itemIds }) => {
      const newItemIds = new Map(itemIds);
      newItemIds.set(name, id);
      return { itemIds: newItemIds };
    });
  }

  getItemId(name, createIfNecessary = true) {
    const { itemIds } = this.state;
    let id = itemIds.get(name);
    if (id == null && createIfNecessary) {
      id = shortid.generate();
      this.setItemId(name, id);
    }
    return id;
  }

  handleTabBlur() {
    if (this.consoleRef) {
      this.consoleRef.blur();
    }
  }

  handleTabFocus() {
    if (this.consoleRef) {
      this.consoleRef.focus();
    }
  }

  handlePanelMount(panel) {
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

  handleFocusCommandHistory() {
    const { glEventHub } = this.props;
    glEventHub.emit(ConsoleEvent.FOCUS_HISTORY);
  }

  handleResize() {
    this.updateDimensions();
  }

  handleShow() {
    this.updateDimensions();
  }

  handleOpenObject(object) {
    const { sessionWrapper } = this.props;
    const { session } = sessionWrapper;
    this.openWidget(object, session);
  }

  handleCloseObject(object) {
    const { name } = object;
    const id = this.getItemId(name, false);
    const { glEventHub } = this.props;
    glEventHub.emit(PanelEvent.CLOSE, id);
  }

  handleSettingsChange(consoleSettings) {
    const { glEventHub } = this.props;
    log.debug('handleSettingsChange', consoleSettings);
    this.setState({
      consoleSettings,
    });
    glEventHub.emit(ConsoleEvent.SETTINGS_CHANGED, consoleSettings);
  }

  /**
   * @param {VariableDefinition} widget The widget to open
   * @param {dh.Session} session The session object
   */
  openWidget(widget, session) {
    const { glEventHub } = this.props;
    const { name } = widget;
    const panelId = this.getItemId(name);
    const openOptions = {
      fetch: () => session.getObject(widget),
      panelId,
      widget,
    };

    log.debug('openWidget', openOptions);

    glEventHub.emit(PanelEvent.OPEN, openOptions);
  }

  addCommand(command, focus = true, execute = false) {
    this.consoleRef.current?.addCommand(command, focus, execute);
  }

  /**
   * Close the disconnected panels from this session
   * @param {boolean} force True to force the panels closed regardless of the current setting
   */
  closeDisconnectedPanels(force = false) {
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

  savePanelState() {
    const { consoleSettings, itemIds } = this.state;
    const panelState = {
      consoleSettings,
      itemIds: [...itemIds],
    };
    log.debug('Saving panel state', panelState);
    // eslint-disable-next-line react/no-unused-state
    this.setState({ panelState });
  }

  updateDimensions() {
    this.consoleRef.current?.updateDimensions();
  }

  render() {
    const {
      commandHistoryStorage,
      glContainer,
      glEventHub,
      sessionWrapper,
      timeZone,
      unzip,
    } = this.props;
    const { consoleSettings, error, objectMap } = this.state;
    // eslint-disable-next-line react/prop-types
    const { config, session, connection } = sessionWrapper;
    const { id: sessionId, type: language } = config;

    return (
      <Panel
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onResize={this.handleResize}
        onShow={this.handleShow}
        onTabFocus={this.handleTabFocus}
        onTabBlur={this.handleTabBlur}
        errorMessage={error != null ? `${error}` : null}
      >
        <>
          {session && (
            <Console
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
                  <div>&nbsp;</div>
                  <div>{ConsoleConstants.LANGUAGE_MAP.get(language)}</div>
                  <div>&nbsp;</div>
                  <div>
                    <HeapUsage
                      connection={connection}
                      defaultUpdateInterval={10 * 1000}
                      hoverUpdateInterval={3 * 1000}
                      monitorDuration={10 * 60 * 1000}
                    />
                  </div>
                  <div>&nbsp;</div>
                </>
              }
              scope={sessionId}
              timeZone={timeZone}
              objectMap={objectMap}
              unzip={unzip}
            />
          )}
        </>
      </Panel>
    );
  }
}

ConsolePanel.propTypes = {
  commandHistoryStorage: PropTypes.shape({}).isRequired,
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,

  panelState: PropTypes.shape({
    consoleCreatorSettings: PropTypes.shape({}),
    consoleSettings: PropTypes.shape({}),
    itemIds: PropTypes.array,
  }),

  sessionWrapper: PropTypes.shape({
    session: APIPropTypes.IdeSession.isRequired,
    config: PropTypes.shape({ type: PropTypes.string, id: PropTypes.string })
      .isRequired,
  }).isRequired,

  timeZone: PropTypes.string.isRequired,
  unzip: PropTypes.func,
};

ConsolePanel.defaultProps = {
  panelState: null,
  unzip: null,
};

const mapStateToProps = (state, ownProps) => ({
  commandHistoryStorage: getCommandHistoryStorage(state),
  sessionWrapper: getDashboardSessionWrapper(state, ownProps.localDashboardId),
  timeZone: getTimeZone(state),
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  ConsolePanel
);
