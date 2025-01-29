import React, { PureComponent, type ReactElement } from 'react';
import { createXComponent } from '@deephaven/components';
import { type BasePanelProps, BasePanel } from '@deephaven/dashboard';
import type { dh } from '@deephaven/jsapi-types';
import { ConsoleEvent, InputFilterEvent } from '../events';

export type CorePanelProps = BasePanelProps & {
  onClearAllFilters?: (...args: unknown[]) => void;
  onSessionClose?: (session: dh.IdeSession) => void;
  onSessionOpen?: (
    session: dh.IdeSession,
    { language, sessionId }: { language: string; sessionId: string }
  ) => void;
};

/**
 * Generic panel component that emits mount/unmount/focus events.
 * Also wires up some triggers for common events:
 * Focus, Resize, Show, Session open/close, client disconnect/reconnect.
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

    glEventHub.on(ConsoleEvent.SESSION_CLOSED, this.handleSessionClosed);
    glEventHub.on(ConsoleEvent.SESSION_OPENED, this.handleSessionOpened);
    glEventHub.on(
      InputFilterEvent.CLEAR_ALL_FILTERS,
      this.handleClearAllFilters
    );
  }

  componentWillUnmount(): void {
    const { glEventHub } = this.props;

    glEventHub.off(ConsoleEvent.SESSION_CLOSED, this.handleSessionClosed);
    glEventHub.off(ConsoleEvent.SESSION_OPENED, this.handleSessionOpened);
    glEventHub.off(
      InputFilterEvent.CLEAR_ALL_FILTERS,
      this.handleClearAllFilters
    );
  }

  handleClearAllFilters(...args: unknown[]): void {
    const { onClearAllFilters } = this.props;
    onClearAllFilters?.(...args);
  }

  handleSessionClosed(session: dh.IdeSession): void {
    const { onSessionClose } = this.props;
    onSessionClose?.(session);
  }

  handleSessionOpened(
    session: dh.IdeSession,
    params: { language: string; sessionId: string }
  ): void {
    const { onSessionOpen } = this.props;
    onSessionOpen?.(session, params);
  }

  render(): ReactElement {
    const { children, ...otherProps } = this.props;

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <BasePanel {...otherProps}>{children}</BasePanel>;
  }
}

const XCorePanel = createXComponent(CorePanel);

export default XCorePanel;
