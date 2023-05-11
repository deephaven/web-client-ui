import React, { PureComponent, ReactElement, ReactNode } from 'react';
import classNames from 'classnames';
import dh from '@deephaven/jsapi-shim';
import type { IdeSession, VariableDefinition } from '@deephaven/jsapi-types';
import { DropdownAction, Tooltip } from '@deephaven/components';
import { CanceledPromiseError, Pending } from '@deephaven/utils';
import ConsoleMenu from './ConsoleMenu';
import './ConsoleStatusBar.scss';

interface ConsoleStatusBarProps {
  children: ReactNode;
  session: IdeSession;
  openObject: (object: VariableDefinition) => void;
  objects: VariableDefinition[];
  overflowActions: () => DropdownAction[];
}

interface ConsoleStatusBarState {
  isDisconnected: boolean;
  isCommandRunning: boolean;
}

export class ConsoleStatusBar extends PureComponent<
  ConsoleStatusBarProps,
  ConsoleStatusBarState
> {
  static defaultProps = {
    children: null,
  };

  constructor(props: ConsoleStatusBarProps) {
    super(props);

    this.handleCommandStarted = this.handleCommandStarted.bind(this);
    this.handleCommandCompleted = this.handleCommandCompleted.bind(this);

    this.pending = new Pending();

    this.state = {
      isDisconnected: false,
      isCommandRunning: false,
    };
  }

  componentDidMount(): void {
    this.startListening();
  }

  componentWillUnmount(): void {
    this.stopListening();
    this.cancelPendingPromises();
  }

  pending: Pending;

  startListening(): void {
    const { session } = this.props;
    session.addEventListener(
      dh.IdeSession.EVENT_COMMANDSTARTED,
      this.handleCommandStarted
    );
  }

  stopListening(): void {
    const { session } = this.props;
    session.removeEventListener(
      dh.IdeSession.EVENT_COMMANDSTARTED,
      this.handleCommandStarted
    );
  }

  cancelPendingPromises(): void {
    this.pending.cancel();
  }

  handleCommandStarted(event: CustomEvent): void {
    const { result } = event.detail;

    this.pending
      .add(result)
      .then(() => this.handleCommandCompleted(null))
      .catch(error => this.handleCommandCompleted(error));

    this.setState({
      isCommandRunning: true,
    });
  }

  handleCommandCompleted(error: unknown): void {
    // Don't update state if the promise was canceled
    if (!(error instanceof CanceledPromiseError)) {
      this.setState({
        isCommandRunning: this.pending.pending.length > 0,
      });
    }
  }

  render(): ReactElement {
    const { children, openObject, overflowActions, objects } = this.props;
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

export default ConsoleStatusBar;
