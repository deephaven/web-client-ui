// Wrapper for the Console for use in a golden layout container
// Will probably need to handle window popping out from golden layout here.
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { LogView } from '@deephaven/console';
import type { dh } from '@deephaven/jsapi-types';
import { type DashboardPanelProps } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { type RootState } from '@deephaven/redux';
import './LogPanel.scss';
import Panel from './Panel';
import { getDashboardSessionWrapper } from '../redux';

const log = Log.module('LogPanel');

interface LogPanelProps extends DashboardPanelProps {
  session?: dh.IdeSession;
}

interface LogPanelState {
  session?: dh.IdeSession;
}

class LogPanel extends PureComponent<LogPanelProps, LogPanelState> {
  static defaultProps = {
    session: null,
  };

  static COMPONENT = 'LogPanel';

  static TITLE = 'Log';

  constructor(props: LogPanelProps) {
    super(props);

    this.handleResize = this.handleResize.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handleHide = this.handleHide.bind(this);
    this.handleSessionOpened = this.handleSessionOpened.bind(this);
    this.handleSessionClosed = this.handleSessionClosed.bind(this);

    this.isBottomVisible = true;
    this.logView = null;

    const { session } = this.props;

    this.state = { session };
  }

  isBottomVisible: boolean;

  logView: LogView | null;

  handleResize(): void {
    this.updateDimensions();
  }

  handleShow(): void {
    this.updateDimensions();
    if (this.logView) {
      this.logView.triggerFindWidget();

      if (this.isBottomVisible) {
        this.logView.scrollToBottom();
      }
    }
  }

  handleHide(): void {
    if (this.logView) {
      this.isBottomVisible = this.logView.isBottomVisible();
    }
  }

  handleSessionOpened(session: dh.IdeSession): void {
    log.debug('Session opened', [session]);
    this.setState({ session });
  }

  // eslint-disable-next-line class-methods-use-this
  handleSessionClosed(session: dh.IdeSession): void {
    log.debug('Session closed', session);
    // Keep the session reference in state unchanged until the session is re-connected
  }

  updateDimensions(): void {
    if (this.logView) {
      this.logView.updateDimensions();
    }
  }

  render(): JSX.Element {
    const { glContainer, glEventHub } = this.props;
    const { session } = this.state;
    return (
      <Panel
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onResize={this.handleResize}
        onHide={this.handleHide}
        onShow={this.handleShow}
        onSessionOpen={this.handleSessionOpened}
        onSessionClose={this.handleSessionClosed}
      >
        {session == null && (
          <div className="log-panel-disconnected-message">
            Waiting for session connection
          </div>
        )}
        {session != null && (
          <LogView
            session={session}
            ref={logView => {
              this.logView = logView;
            }}
          />
        )}
      </Panel>
    );
  }
}

const mapStateToProps = (
  state: RootState,
  ownProps: { localDashboardId: string }
): Pick<LogPanelProps, 'session'> => ({
  session: getDashboardSessionWrapper(state, ownProps.localDashboardId)
    ?.session,
});

const ConnectedLogPanel = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(LogPanel);

export default ConnectedLogPanel;
