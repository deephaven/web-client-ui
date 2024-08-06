import React, { PureComponent, ReactElement } from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import { ContextActions, createXComponent } from '@deephaven/components';
import { copyToClipboard } from '@deephaven/utils';
import Panel from './Panel';
import WidgetPanelTooltip from './WidgetPanelTooltip';
import './WidgetPanel.scss';
import {
  InnerWidgetPanelProps,
  WidgetPanelDescriptor,
} from './WidgetPanelTypes';

interface WidgetPanelState {
  isClientDisconnected: boolean;
  isPanelDisconnected: boolean;
  isWidgetDisconnected: boolean;
  isWaitingForReconnect: boolean;
  isPanelInactive: boolean;
}
/**
 * Widget panel component that has a loading spinner and displays an error message when set
 */
class WidgetPanel extends PureComponent<
  InnerWidgetPanelProps,
  WidgetPanelState
> {
  static defaultProps = {
    className: '',
    isClonable: true,
    isDisconnected: false,
    isLoading: false,
    isLoaded: true,
    isRenamable: true,
    showTabTooltip: true,
  };

  constructor(props: InnerWidgetPanelProps) {
    super(props);

    this.handleSessionClosed = this.handleSessionClosed.bind(this);
    this.handleSessionOpened = this.handleSessionOpened.bind(this);
    this.handleCopyName = this.handleCopyName.bind(this);

    this.state = {
      isClientDisconnected: false,
      isPanelDisconnected: false,
      isWidgetDisconnected: false,
      isWaitingForReconnect: false,
      isPanelInactive: false,
    };
  }

  handleCopyName(): void {
    const { descriptor } = this.props;
    copyToClipboard(descriptor.name);
  }

  getErrorMessage(): string | undefined {
    const { descriptor, errorMessage } = this.props;
    const {
      isClientDisconnected,
      isPanelDisconnected,
      isWidgetDisconnected,
      isWaitingForReconnect,
    } = this.state;
    if (errorMessage != null && errorMessage !== '') {
      return `${errorMessage}`;
    }
    if (isClientDisconnected && isPanelDisconnected && isWaitingForReconnect) {
      return 'Disconnected from server.\nCheck your internet connection.';
    }
    if (isClientDisconnected && isPanelDisconnected) {
      return 'Disconnected from server.';
    }
    if (isPanelDisconnected) {
      const { name, type } = descriptor;
      return `Variable "${name}" not set.\n${type} does not exist yet.`;
    }
    if (isWidgetDisconnected) {
      return `${descriptor.name} is unavailable.`;
    }
    return undefined;
  }

  getCachedRenderTabTooltip = memoize(
    (showTabTooltip: boolean, descriptor: WidgetPanelDescriptor) =>
      showTabTooltip
        ? () => <WidgetPanelTooltip descriptor={descriptor} />
        : undefined
  );

  getCachedActions = memoize((descriptor: WidgetPanelDescriptor) => [
    {
      title: `Copy ${descriptor.displayType ?? descriptor.type} Name`,
      group: ContextActions.groups.medium,
      order: 20,
      action: this.handleCopyName,
    },
  ]);

  handleSessionClosed(...args: unknown[]): void {
    const { onSessionClose } = this.props;
    // The session has closed and we won't be able to reconnect, as this widget isn't persisted
    this.setState({
      isPanelDisconnected: true,
      isWaitingForReconnect: false,
    });
    onSessionClose?.(...args);
  }

  handleSessionOpened(...args: unknown[]): void {
    const { onSessionOpen } = this.props;
    onSessionOpen?.(...args);
  }

  render(): ReactElement {
    const {
      children,
      className,
      componentPanel,
      descriptor,
      isLoaded,
      isLoading,
      glContainer,
      glEventHub,
      isDisconnected,
      isClonable,
      isRenamable,
      showTabTooltip = false,
      renderTabTooltip,

      onClearAllFilters,
      onHide,
      onFocus,
      onBlur,
      onResize,
      onShow,
      onTabBlur,
      onTabFocus,
      onTabClicked,
    } = this.props;

    const { isPanelDisconnected, isWidgetDisconnected, isPanelInactive } =
      this.state;
    const errorMessage = this.getErrorMessage();
    const doRenderTabTooltip =
      renderTabTooltip ??
      this.getCachedRenderTabTooltip(showTabTooltip, descriptor);

    const additionalActions = this.getCachedActions(descriptor);

    return (
      <Panel
        className={classNames(className, {
          disconnected:
            isPanelDisconnected || isWidgetDisconnected || isDisconnected,
          inactive: isPanelInactive,
        })}
        componentPanel={componentPanel}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onClearAllFilters={onClearAllFilters}
        onHide={onHide}
        onFocus={onFocus}
        onBlur={onBlur}
        onResize={onResize}
        onShow={onShow}
        onSessionClose={this.handleSessionClosed}
        onSessionOpen={this.handleSessionOpened}
        onTabBlur={onTabBlur}
        onTabFocus={onTabFocus}
        onTabClicked={onTabClicked}
        renderTabTooltip={doRenderTabTooltip}
        errorMessage={errorMessage}
        isLoaded={isLoaded}
        isLoading={isLoading}
        isClonable={isClonable}
        isRenamable={isRenamable}
        additionalActions={additionalActions}
      >
        {children}
        {isPanelInactive && <div className="fill-parent-absolute" />}
      </Panel>
    );
  }
}

const XWidgetPanel = createXComponent(WidgetPanel);

export default XWidgetPanel;
