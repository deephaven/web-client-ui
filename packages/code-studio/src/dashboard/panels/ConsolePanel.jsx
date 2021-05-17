// Wrapper for the Console for use in a golden layout container
// Will probably need to handle window popping out from golden layout here.
import React, { PureComponent } from 'react';
import { CSSTransition } from 'react-transition-group';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import debounce from 'lodash.debounce';
import memoize from 'memoize-one';
import { connect } from 'react-redux';
import { Console, ConsoleConstants, ConsoleUtils } from '@deephaven/console';
import { IrisGridModelFactory } from '@deephaven/iris-grid';
import dh from '@deephaven/jsapi-shim';
import { ContextActions, ThemeExport } from '@deephaven/components';
import Log from '@deephaven/log';
import { getCommandHistoryStorage } from '@deephaven/redux';
import { Pending, PromiseUtils } from '@deephaven/utils';
import {
  ChartEvent,
  ConsoleEvent,
  ControlEvent,
  IrisGridEvent,
  PandasEvent,
  PanelEvent,
} from '../events';
import { FigureChartModel } from '../../chart';
import { GLPropTypes } from '../../include/prop-types';
import './ConsolePanel.scss';
import Panel from './Panel';

const log = Log.module('ConsolePanel');

const DEBOUNCE_PANEL_STATE_UPDATE = 500;

const DEFAULT_PANEL_STATE = Object.freeze({
  consoleSettings: {},
  itemIds: [],
});

class ConsolePanel extends PureComponent {
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
    this.pending = new Pending();

    const { panelState: initialPanelState } = props;
    const panelState = {
      ...DEFAULT_PANEL_STATE,
      ...(initialPanelState || {}),
    };
    const { consoleSettings, itemIds } = panelState;

    const language =
      process.env.REACT_APP_SESSION_LANGUAGE ??
      Array.from(ConsoleConstants.LANGUAGE_MAP.keys())[0];

    this.state = {
      consoleSettings,
      language,
      itemIds: new Map(itemIds),

      isLoading: true,

      session: null,
      sessionId: null,

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

    this.initSession();
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

    this.pending.cancel();

    const { session } = this.state;
    session?.close();
  }

  async initSession() {
    try {
      const { language } = this.state;

      const baseUrl = new URL(
        process.env.REACT_APP_CORE_API_URL,
        window.location
      );

      log.info('Starting session with language', language);

      const session = await this.pending.add(
        dh.Ide.getExistingSession(
          `${baseUrl.protocol}//${baseUrl.host}`,
          '',
          null,
          language
        )
      );
      const sessionId = shortid.generate();

      log.info('Console session established');

      const { glEventHub } = this.props;
      glEventHub.emit(ConsoleEvent.SESSION_OPENED, session, {
        language,
        sessionId,
      });

      this.setState({ isLoading: false, session, sessionId }, () => {
        this.consoleRef.current?.focus();
      });
    } catch (error) {
      if (PromiseUtils.isCanceled(error)) {
        return;
      }

      log.error('Error Creating Console: ', error);

      this.setState({ isLoading: false, error });
    }
  }

  setItemId(name, id) {
    this.setState(({ itemIds }) => {
      const newItemIds = new Map(itemIds);
      newItemIds.set(name, id);
      return { itemIds: newItemIds };
    });
  }

  getCachedActions = memoize(language => {
    const languages = Array.from(ConsoleConstants.LANGUAGE_MAP.keys()).filter(
      l => l !== language
    );
    return languages.map(newLanguage => ({
      title: `Switch to ${ConsoleConstants.LANGUAGE_MAP.get(newLanguage)}`,
      action: () => this.switchLanguage(newLanguage),
      group: ContextActions.groups.medium,
      order: 100,
    }));
  });

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
    const { session } = this.state;
    const { type } = object;
    if (ConsoleUtils.isTableType(type)) {
      this.openTable(object, session);
    } else if (ConsoleUtils.isFigureType(type)) {
      this.openFigure(object, session);
    } else if (ConsoleUtils.isPandas(type)) {
      this.openPandas(object, session);
    } else {
      log.error('Unknown object', object);
    }
  }

  handleCloseObject(object) {
    const { name } = object;
    const id = this.getItemId(name, false);
    const { glEventHub } = this.props;
    glEventHub.emit(ControlEvent.CLOSE, id);
  }

  handleSettingsChange(consoleSettings) {
    const { glEventHub } = this.props;
    log.debug('handleSettingsChange', consoleSettings);
    this.setState({
      consoleSettings,
    });
    glEventHub.emit(ConsoleEvent.SETTINGS_CHANGED, consoleSettings);
  }

  switchLanguage(newLanguage) {
    const { language, session, sessionId } = this.state;

    log.debug('Switching language to', newLanguage);

    session.close();
    const { glEventHub } = this.props;
    glEventHub.emit(ConsoleEvent.SESSION_CLOSED, session, {
      language,
      sessionId,
    });
    this.setState(
      {
        language: newLanguage,
        isLoading: true,
        session: null,
        sessionId: null,
      },
      () => {
        this.initSession();
      }
    );
  }

  openTable(object, session) {
    const { name } = object;
    const id = this.getItemId(name);
    const metadata = { table: name };
    const { glEventHub } = this.props;
    const makeModel = () =>
      session
        .getObject(object)
        .then(table => IrisGridModelFactory.makeModel(table, true));

    log.debug('handleOpenTable', id);

    glEventHub.emit(IrisGridEvent.OPEN_GRID, name, makeModel, metadata, id);
  }

  openFigure(object, session) {
    const { name } = object;
    const id = this.getItemId(name);
    const metadata = { figure: name };
    const makeModel = () =>
      session.getObject(object).then(result => new FigureChartModel(result));

    const { glEventHub } = this.props;
    glEventHub.emit(ChartEvent.OPEN, name, makeModel, metadata, id);
  }

  openPandas(object, session) {
    const { name } = object;
    const id = this.getItemId(name);
    const metadata = { table: name };
    const { glEventHub } = this.props;
    const makeModel = () =>
      session
        .getObject(object)
        .then(table => IrisGridModelFactory.makeModel(table, true));

    log.debug('handleOpenTable', id);

    glEventHub.emit(PandasEvent.OPEN, name, makeModel, metadata, id);
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
      glEventHub.emit(ControlEvent.CLOSE, panelId);
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
    const { commandHistoryStorage, glContainer, glEventHub } = this.props;
    const {
      consoleSettings,
      error,
      isLoading,
      language,
      session,
      sessionId,
    } = this.state;
    const name = ConsoleConstants.LANGUAGE_MAP.get(language);
    const actions = this.getCachedActions(language);
    return (
      <Panel
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onResize={this.handleResize}
        onShow={this.handleShow}
        onTabFocus={this.handleTabFocus}
        onTabBlur={this.handleTabBlur}
        isLoading={isLoading}
        isLoaded={session != null}
        errorMessage={error != null ? `${error}` : null}
      >
        <CSSTransition
          in={session != null}
          timeout={ThemeExport.transitionMidMs}
          classNames="fade"
          mountOnEnter
          unmountOnExit
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
                name={name}
                scope={sessionId}
                actions={actions}
              />
            )}
          </>
        </CSSTransition>
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
};

ConsolePanel.defaultProps = {
  panelState: null,
};

const mapStateToProps = state => ({
  commandHistoryStorage: getCommandHistoryStorage(state),
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  ConsolePanel
);
