import React, {
  Component,
  PureComponent,
  ReactElement,
  ReactNode,
} from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import { Container, EventEmitter } from '@deephaven/golden-layout';
import Panel from './Panel';
import WidgetPanelTooltip from './WidgetPanelTooltip';
import './WidgetPanel.scss';

interface WidgetPanelProps {
  children: ReactNode;
  componentPanel: Component;

  glContainer: Container;
  glEventHub: EventEmitter;

  className: string;
  errorMessage: string;
  isClonable: boolean;
  isDisconnected: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  isRenamable: boolean;
  showTabTooltip: boolean;
  widgetName: string;
  widgetType: string;
  renderTabTooltip: () => ReactNode;
  description: string;

  onFocus: () => void;
  onBlur: () => void;
  onHide: () => void;
  onClearAllFilters: () => void;
  onResize: () => void;
  onSessionClose: (...args: unknown[]) => void;
  onSessionOpen: (...args: unknown[]) => void;
  onShow: () => void;
  onTabBlur: () => void;
  onTabFocus: () => void;
  onTabClicked: () => void;
}

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
    errorMessage: null,
    isClonable: true,
    isDisconnected: false,
    isLoading: false,
    isLoaded: true,
    isRenamable: true,
    showTabTooltip: true,
    widgetName: 'Widget',
    widgetType: 'Widget',
    renderTabTooltip: null,
    description: '',

    onFocus: (): void => undefined,
    onBlur: (): void => undefined,
    onHide: (): void => undefined,
    onClearAllFilters: (): void => undefined,
    onResize: (): void => undefined,
    onSessionClose: (): void => undefined,
    onSessionOpen: (): void => undefined,
    onShow: (): void => undefined,
    onTabBlur: (): void => undefined,
    onTabFocus: (): void => undefined,
    onTabClicked: (): void => undefined,
  };

  constructor(props: WidgetPanelProps) {
    super(props);

    this.handleSessionClosed = this.handleSessionClosed.bind(this);
    this.handleSessionOpened = this.handleSessionOpened.bind(this);

    this.state = {
      isClientDisconnected: false,
      isPanelDisconnected: false,
      isWidgetDisconnected: false,
      isWaitingForReconnect: false,
      isPanelInactive: false,
    };
  }

  getErrorMessage(): string | undefined {
    const { errorMessage } = this.props;
    const {
      isClientDisconnected,
      isPanelDisconnected,
      isWidgetDisconnected,
      isWaitingForReconnect,
    } = this.state;
    if (errorMessage) {
      return `${errorMessage}`;
    }
    if (isClientDisconnected && isPanelDisconnected && isWaitingForReconnect) {
      return 'Disconnected from server.\nCheck your internet connection.';
    }
    if (isClientDisconnected && isPanelDisconnected) {
      return 'Disconnected from server.';
    }
    if (isPanelDisconnected) {
      const { widgetName, widgetType } = this.props;
      return `Variable "${widgetName}" not set.\n${widgetType} does not exist yet.`;
    }
    if (isWidgetDisconnected) {
      const { widgetName } = this.props;
      return `${widgetName} is unavailable.`;
    }
    return undefined;
  }

  getCachedRenderTabTooltip = memoize(
    (
      showTabTooltip: boolean,
      glContainer: Container,
      widgetType: string,
      widgetName: string,
      description: string
    ) =>
      showTabTooltip
        ? () => (
            <WidgetPanelTooltip
              glContainer={glContainer}
              widgetType={widgetType}
              widgetName={widgetName}
              description={description}
            />
          )
        : null
  );

  handleSessionClosed(...args: unknown[]): void {
    const { onSessionClose } = this.props;
    // The session has closed and we won't be able to reconnect, as this widget isn't persisted
    this.setState({
      isPanelDisconnected: true,
      isWaitingForReconnect: false,
    });
    onSessionClose(...args);
  }

  handleSessionOpened(...args: unknown[]): void {
    const { onSessionOpen } = this.props;
    onSessionOpen(...args);
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
      showTabTooltip,
      renderTabTooltip,
      widgetType,
      widgetName,
      description,

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

    const {
      isPanelDisconnected,
      isWidgetDisconnected,
      isPanelInactive,
    } = this.state;
    const errorMessage = this.getErrorMessage();
    const doRenderTabTooltip =
      renderTabTooltip ??
      this.getCachedRenderTabTooltip(
        showTabTooltip,
        glContainer,
        widgetType,
        widgetName,
        description
      );

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
      >
        {children}
        {isPanelInactive && <div className="fill-parent-absolute" />}
      </Panel>
    );
  }
}

export default WidgetPanel;
