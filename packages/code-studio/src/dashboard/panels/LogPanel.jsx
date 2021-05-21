// Wrapper for the Console for use in a golden layout container
// Will probably need to handle window popping out from golden layout here.
import React, { PureComponent } from 'react';
import Log from '@deephaven/log';
import { LogView } from '@deephaven/console';
import './LogPanel.scss';
import Panel from './Panel';
import { GLPropTypes, IrisPropTypes } from '../../include/prop-types';

const log = Log.module('LogPanel');

class LogPanel extends PureComponent {
  static COMPONENT = 'LogPanel';

  static TITLE = 'Log';

  constructor(props) {
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

  handleResize() {
    this.updateDimensions();
  }

  handleShow() {
    this.updateDimensions();
    if (this.logView) {
      this.logView.triggerFindWidget();

      if (this.isBottomVisible) {
        this.logView.scrollToBottom();
      }
    }
  }

  handleHide() {
    if (this.logView) {
      this.isBottomVisible = this.logView.isBottomVisible();
    }
  }

  handleSessionOpened(session) {
    log.debug('Session opened', [session]);
    this.setState({ session });
  }

  // eslint-disable-next-line class-methods-use-this
  handleSessionClosed(session) {
    log.debug('Session closed', session);
    // Keep the session reference in state unchanged until the session is re-connected
  }

  updateDimensions() {
    if (this.logView) {
      this.logView.updateDimensions();
    }
  }

  render() {
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
        {!session && (
          <div className="log-panel-disconnected-message">
            Waiting for session connection
          </div>
        )}
        {session && (
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

LogPanel.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  session: IrisPropTypes.IdeSession,
};

LogPanel.defaultProps = {
  session: null,
};

export default LogPanel;
