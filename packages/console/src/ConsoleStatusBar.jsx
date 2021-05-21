import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import dh, { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import { Tooltip } from '@deephaven/components';
import { CanceledPromiseError, Pending } from '@deephaven/utils';
import ConsoleMenu from './ConsoleMenu';
import './ConsoleStatusBar.scss';

export class ConsoleStatusBar extends PureComponent {
  constructor(props) {
    super(props);

    this.handleCommandStarted = this.handleCommandStarted.bind(this);
    this.handleCommandCompleted = this.handleCommandCompleted.bind(this);

    this.pending = new Pending();

    this.state = {
      isDisconnected: false,
      isCommandRunning: false,
    };
  }

  componentDidMount() {
    this.startListening();
  }

  componentWillUnmount() {
    this.stopListening();
    this.cancelPendingPromises();
  }

  startListening() {
    const { session } = this.props;
    session.addEventListener(
      dh.IdeSession.EVENT_COMMANDSTARTED,
      this.handleCommandStarted
    );
  }

  stopListening() {
    const { session } = this.props;
    session.removeEventListener(
      dh.IdeSession.EVENT_COMMANDSTARTED,
      this.handleCommandStarted
    );
  }

  cancelPendingPromises() {
    this.pending.cancel();
  }

  handleCommandStarted(event) {
    const { result } = event.detail;

    this.pending
      .add(result)
      .then(() => this.handleCommandCompleted(null, result))
      .catch(error => this.handleCommandCompleted(error, result));

    this.setState({
      isCommandRunning: true,
    });
  }

  handleCommandCompleted(error) {
    // Don't update state if the promise was canceled
    if (!(error instanceof CanceledPromiseError)) {
      this.setState({
        isCommandRunning: this.pending.pending.length > 0,
      });
    }
  }

  render() {
    const { children, name, openObject, overflowActions, objects } = this.props;
    const { isDisconnected, isCommandRunning } = this.state;

    let statusIconClass = null;
    let tooltipText = null;

    if (isDisconnected) {
      statusIconClass = 'console-status-icon-disconnected';
      tooltipText = 'Worker is disconnected';
    } else if (isCommandRunning) {
      // Connected, Pending
      statusIconClass = 'console-status-icon-pending';
      tooltipText = 'Worker is busy';
    } else {
      // Connected, Idle
      statusIconClass = 'console-status-icon-idle';
      tooltipText = 'Worker is idle';
    }

    return (
      <div className="console-pane-status-bar">
        <div>
          <div className={classNames('console-status-icon', statusIconClass)} />
          <div>&nbsp;</div>
          <div>{name}</div>
          <Tooltip>{tooltipText}</Tooltip>
        </div>
        {children}
        <ConsoleMenu
          overflowActions={overflowActions}
          openObject={openObject}
          objects={objects}
        />
      </div>
    );
  }
}

ConsoleStatusBar.propTypes = {
  children: PropTypes.node,
  name: PropTypes.string,
  session: APIPropTypes.IdeSession.isRequired,
  openObject: PropTypes.func.isRequired,
  objects: PropTypes.arrayOf(APIPropTypes.VariableDefinition).isRequired,
  overflowActions: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.arrayOf(PropTypes.shape({})),
  ]).isRequired,
};

ConsoleStatusBar.defaultProps = {
  children: null,
  name: 'Default',
};

export default ConsoleStatusBar;
