import React, { Component, PureComponent } from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import PropTypes from 'prop-types';
import { GLPropTypes } from '@deephaven/dashboard';
import Panel from './Panel';
import WidgetPanelTooltip from './WidgetPanelTooltip';
import './WidgetPanel.scss';

/**
 * Widget panel component that has a loading spinner and displays an error message when set
 */
class WidgetPanel extends PureComponent {
  constructor(props) {
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

  getErrorMessage() {
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
    return null;
  }

  getCachedRenderTabTooltip = memoize(
    (showTabTooltip, glContainer, widgetType, widgetName, description) =>
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

  handleSessionClosed(...args) {
    const { onSessionClose } = this.props;
    // The session has closed and we won't be able to reconnect, as this widget isn't persisted
    this.setState({
      isPanelDisconnected: true,
      isWaitingForReconnect: false,
    });
    onSessionClose(...args);
  }

  handleSessionOpened(...args) {
    const { onSessionOpen } = this.props;
    onSessionOpen(...args);
  }

  render() {
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

WidgetPanel.propTypes = {
  children: PropTypes.node.isRequired,
  componentPanel: PropTypes.instanceOf(Component).isRequired,

  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,

  className: PropTypes.string,
  errorMessage: PropTypes.string,
  isClonable: PropTypes.bool,
  isDisconnected: PropTypes.bool,
  isLoading: PropTypes.bool,
  isLoaded: PropTypes.bool,
  isRenamable: PropTypes.bool,
  showTabTooltip: PropTypes.bool,
  widgetName: PropTypes.string,
  widgetType: PropTypes.string,
  renderTabTooltip: PropTypes.func,
  description: PropTypes.string,

  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onHide: PropTypes.func,
  onClearAllFilters: PropTypes.func,
  onResize: PropTypes.func,
  onSessionClose: PropTypes.func,
  onSessionOpen: PropTypes.func,
  onShow: PropTypes.func,
  onTabBlur: PropTypes.func,
  onTabFocus: PropTypes.func,
};

WidgetPanel.defaultProps = {
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

  onFocus: () => {},
  onBlur: () => {},
  onHide: () => {},
  onClearAllFilters: () => {},
  onResize: () => {},
  onSessionClose: () => {},
  onSessionOpen: () => {},
  onShow: () => {},
  onTabBlur: () => {},
  onTabFocus: () => {},
};

export default WidgetPanel;
