import React, { PureComponent, type ReactElement } from 'react';
import { createXComponent } from '@deephaven/components';
import { type BasePanelProps, BasePanel } from '@deephaven/dashboard';
import type { dh } from '@deephaven/jsapi-types';
import {
  type CoreConsoleSession,
  listenForSessionClosed,
  listenForSessionOpened,
} from '../ConsoleEvents';
import { InputFilterEvent } from '../events';

export type CorePanelProps = BasePanelProps & {
  onClearAllFilters?: (...args: unknown[]) => void;
  onSessionClose?: (session: dh.IdeSession) => void;
  onSessionOpen?: (session: CoreConsoleSession) => void;
};

/**
 * Extends the base panel component to handle Session events and input filter events.
 */
class CorePanel extends PureComponent<CorePanelProps> {
  constructor(props: CorePanelProps) {
    super(props);

    this.handleClearAllFilters = this.handleClearAllFilters.bind(this);
    this.handleSessionClosed = this.handleSessionClosed.bind(this);
    this.handleSessionOpened = this.handleSessionOpened.bind(this);
  }

  componentDidMount(): void {
    const { glEventHub } = this.props;

    this.stopListenForSessionClosed = listenForSessionClosed(
      glEventHub,
      this.handleSessionClosed
    );
    this.stopListenForSessionOpened = listenForSessionOpened(
      glEventHub,
      this.handleSessionOpened
    );
    glEventHub.on(
      InputFilterEvent.CLEAR_ALL_FILTERS,
      this.handleClearAllFilters
    );
  }

  componentWillUnmount(): void {
    const { glEventHub } = this.props;

    this.stopListenForSessionClosed?.();
    this.stopListenForSessionOpened?.();
    glEventHub.off(
      InputFilterEvent.CLEAR_ALL_FILTERS,
      this.handleClearAllFilters
    );
  }

  stopListenForSessionClosed?: () => void;

  stopListenForSessionOpened?: () => void;

  handleClearAllFilters(...args: unknown[]): void {
    const { onClearAllFilters } = this.props;
    onClearAllFilters?.(...args);
  }

  handleSessionClosed(session: dh.IdeSession): void {
    const { onSessionClose } = this.props;
    onSessionClose?.(session);
  }

  handleSessionOpened(session: CoreConsoleSession): void {
    const { onSessionOpen } = this.props;
    onSessionOpen?.(session);
  }

  render(): ReactElement {
    const { children, ...otherProps } = this.props;

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <BasePanel {...otherProps}>{children}</BasePanel>;
  }
}

const XCorePanel = createXComponent(CorePanel);

export default XCorePanel;
