import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ContextActions } from '@deephaven/components';
import { CommandHistory, SHORTCUTS } from '@deephaven/console';
import { GLPropTypes } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { getCommandHistoryStorage } from '@deephaven/redux';
import { Pending } from '@deephaven/utils';
import { ConsoleEvent, NotebookEvent } from '../events';
import './CommandHistoryPanel.scss';
import Panel from './Panel';
import { getDashboardSessionWrapper } from '../redux';

const log = Log.module('CommandHistoryPanel');

class CommandHistoryPanel extends Component {
  static COMPONENT = 'CommandHistoryPanel';

  static TITLE = 'Command History';

  static handleError(error) {
    log.error(error);
  }

  constructor(props) {
    super(props);

    this.handleFocusHistory = this.handleFocusHistory.bind(this);
    this.handleSessionOpened = this.handleSessionOpened.bind(this);
    this.handleSessionClosed = this.handleSessionClosed.bind(this);
    this.handleSendToConsole = this.handleSendToConsole.bind(this);
    this.handleSendToNotebook = this.handleSendToNotebook.bind(this);

    this.container = React.createRef();
    this.pending = new Pending();

    const { session, sessionId, language, panelState } = props;

    let expandedState = null;
    if (panelState) {
      ({ expandedState = expandedState } = panelState);
    }

    this.state = {
      // eslint-disable-next-line react/no-unused-state
      panelState: {},
      session,
      sessionId,
      language,
      contextActions: [
        {
          action: this.handleFocusHistory,
          shortcut: SHORTCUTS.COMMAND_HISTORY.FOCUS_HISTORY,
        },
      ],
    };
  }

  componentDidMount() {
    const { glEventHub, session } = this.props;
    glEventHub.on(ConsoleEvent.FOCUS_HISTORY, this.handleFocusHistory);
    if (session != null) {
      this.loadTable();
    }
  }

  componentWillUnmount() {
    const { glEventHub } = this.props;
    glEventHub.off(ConsoleEvent.FOCUS_HISTORY, this.handleFocusHistory);

    this.pending.cancel();
  }

  handleFocusHistory() {
    if (this.container.current) {
      this.container.current.focus();
    }
  }

  handleSessionOpened(session, { language, sessionId }) {
    this.setState(
      {
        session,
        sessionId,
        language,
      },
      () => {
        this.loadTable();
      }
    );
  }

  handleSessionClosed() {
    this.pending.cancel();
    this.setState({
      session: null,
      language: null,
      table: null,
    });
  }

  handleSendToNotebook(settings, forceNewNotebook = false) {
    const { session, language } = this.state;
    log.debug('handleSendToNotebook', session, settings);
    if (!session) {
      log.error('Session is not connected.');
      return;
    }
    const { glEventHub } = this.props;
    glEventHub.emit(
      forceNewNotebook
        ? NotebookEvent.CREATE_NOTEBOOK
        : NotebookEvent.SEND_TO_NOTEBOOK,
      session,
      language,
      settings
    );
  }

  handleSendToConsole(command, focus = true, execute = false) {
    log.debug('handleSendToConsole', command);
    const { glEventHub } = this.props;
    glEventHub.emit(ConsoleEvent.SEND_COMMAND, command, focus, execute);
  }

  loadTable() {
    const { commandHistoryStorage } = this.props;
    const { language, sessionId } = this.state;
    this.pending
      .add(
        commandHistoryStorage.getTable(language, sessionId, Date.now()),
        resolved => resolved.close()
      )
      .then(table => {
        this.setState({ table });
      })
      .catch(CommandHistoryPanel.handleError);
  }

  render() {
    const { glContainer, glEventHub, commandHistoryStorage } = this.props;
    const { language, contextActions, table } = this.state;
    return (
      <Panel
        className="command-history-pane"
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onSessionOpen={this.handleSessionOpened}
        onSessionClose={this.handleSessionClosed}
      >
        {!table && (
          <div className="command-history-disconnected-message">
            Waiting for console connection
          </div>
        )}
        {table && (
          <>
            <CommandHistory
              ref={this.container}
              language={language}
              sendToNotebook={this.handleSendToNotebook}
              sendToConsole={this.handleSendToConsole}
              table={table}
              commandHistoryStorage={commandHistoryStorage}
            />
            <ContextActions actions={contextActions} />
          </>
        )}
      </Panel>
    );
  }
}

CommandHistoryPanel.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  panelState: PropTypes.shape({}),
  session: PropTypes.shape({}),
  sessionId: PropTypes.string,
  language: PropTypes.string,
  commandHistoryStorage: PropTypes.shape({ getTable: PropTypes.func })
    .isRequired,
};

CommandHistoryPanel.defaultProps = {
  panelState: null,
  session: null,
  sessionId: null,
  language: null,
};

const mapStateToProps = (state, ownProps) => {
  const commandHistoryStorage = getCommandHistoryStorage(state);
  const sessionWrapper = getDashboardSessionWrapper(
    state,
    ownProps.localDashboardId
  );
  const { session, config: sessionConfig } = sessionWrapper;
  const { type: language, id: sessionId } = sessionConfig;

  return {
    commandHistoryStorage,
    language,
    session,
    sessionId,
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  CommandHistoryPanel
);
