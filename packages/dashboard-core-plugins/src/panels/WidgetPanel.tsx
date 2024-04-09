import React, { PureComponent, ReactElement, ReactNode } from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import { PanelComponent } from '@deephaven/dashboard';
import type { Container, EventEmitter } from '@deephaven/golden-layout';
import { ContextActions, createXComponent } from '@deephaven/components';
import { copyToClipboard } from '@deephaven/utils';
import Panel from './Panel';
import WidgetPanelTooltip from './WidgetPanelTooltip';
import './WidgetPanel.scss';
import {
  getWidgetPanelDescriptorFromProps,
  WidgetPanelDescriptor,
  WidgetPanelTooltipProps,
} from './WidgetPanelTypes';

type WidgetPanelProps = WidgetPanelTooltipProps & {
  children: ReactNode;
  componentPanel?: PanelComponent;

  glContainer: Container;
  glEventHub: EventEmitter;

  className?: string;
  errorMessage?: string;
  isClonable?: boolean;
  isDisconnected?: boolean;
  isLoading?: boolean;
  isLoaded?: boolean;
  isRenamable?: boolean;
  showTabTooltip?: boolean;

  renderTabTooltip?: () => ReactNode;

  onFocus?: () => void;
  onBlur?: () => void;
  onHide?: () => void;
  onClearAllFilters?: () => void;
  onResize?: () => void;
  onSessionClose?: (...args: unknown[]) => void;
  onSessionOpen?: (...args: unknown[]) => void;
  onShow?: () => void;
  onTabBlur?: () => void;
  onTabFocus?: () => void;
  onTabClicked?: () => void;
};

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
class WidgetPanel extends PureComponent<WidgetPanelProps, WidgetPanelState> {
  static defaultProps = {
    className: '',
    isClonable: true,
    isDisconnected: false,
    isLoading: false,
    isLoaded: true,
    isRenamable: true,
    showTabTooltip: true,
    widgetName: 'Widget',
    widgetType: 'Widget',
    description: '',
  };

  constructor(props: WidgetPanelProps) {
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
    const panelDescriptor = this.getPanelDescriptor();
    copyToClipboard(panelDescriptor?.name ?? '');
  }

  getErrorMessage(): string | undefined {
    const { errorMessage } = this.props;
    const panelDescriptor = this.getPanelDescriptor();
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
      const { name, type } = panelDescriptor;
      return `Variable "${name}" not set.\n${type} does not exist yet.`;
    }
    if (isWidgetDisconnected) {
      return `${panelDescriptor.name} is unavailable.`;
    }
    return undefined;
  }

  getCachedRenderTabTooltip = memoize(
    (showTabTooltip: boolean, descriptor: WidgetPanelDescriptor) =>
      showTabTooltip
        ? () => <WidgetPanelTooltip descriptor={descriptor} />
        : undefined
  );

  getCachedPanelDescriptor = memoize((props: WidgetPanelProps) =>
    getWidgetPanelDescriptorFromProps(props)
  );

  getPanelDescriptor(): WidgetPanelDescriptor {
    return this.getCachedPanelDescriptor(this.props);
  }

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

    const panelDescriptor = this.getPanelDescriptor();

    const { isPanelDisconnected, isWidgetDisconnected, isPanelInactive } =
      this.state;
    const errorMessage = this.getErrorMessage();
    const doRenderTabTooltip =
      renderTabTooltip ??
      this.getCachedRenderTabTooltip(showTabTooltip, panelDescriptor);

    const additionalActions = [
      {
        title: `Copy ${panelDescriptor.type} Name`,
        group: ContextActions.groups.medium,
        order: 20,
        action: this.handleCopyName,
      },
    ];

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
