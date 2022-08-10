import React, { Component, PureComponent } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import memoize from 'memoize-one';
import { ContextActions, LoadingOverlay, Tooltip } from '@deephaven/components';
import { GLPropTypes, LayoutUtils, PanelEvent } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { ConsoleEvent, InputFilterEvent, TabEvent } from '../events';
import PanelContextMenu from './PanelContextMenu';
import RenameDialog from './RenameDialog';

const log = Log.module('Panel');

/**
 * Generic panel component that emits mount/unmount/focus events.
 * Also wires up some triggers for common events:
 * Focus, Resize, Show, Session open/close, client disconnect/reconnect.
 */
class Panel extends PureComponent {
  constructor(props) {
    super(props);

    this.handleClearAllFilters = this.handleClearAllFilters.bind(this);
    this.handleCopyPanel = this.handleCopyPanel.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleHide = this.handleHide.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleSessionClosed = this.handleSessionClosed.bind(this);
    this.handleSessionOpened = this.handleSessionOpened.bind(this);
    this.handleBeforeShow = this.handleBeforeShow.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handleTabBlur = this.handleTabBlur.bind(this);
    this.handleTabFocus = this.handleTabFocus.bind(this);
    this.handleRenameCancel = this.handleRenameCancel.bind(this);
    this.handleRenameSubmit = this.handleRenameSubmit.bind(this);
    this.handleShowRenameDialog = this.handleShowRenameDialog.bind(this);
    this.handleTabClicked = this.handleTabClicked.bind(this);
    this.handleTab = this.handleTab.bind(this);

    const { glContainer } = this.props;
    this.state = {
      title: LayoutUtils.getTitleFromContainer(glContainer),
      showRenameDialog: false,
    };
  }

  componentDidMount() {
    const { componentPanel, glContainer, glEventHub } = this.props;

    glContainer.on('resize', this.handleResize);
    glContainer.on('show', this.handleBeforeShow);
    glContainer.on('shown', this.handleShow);
    glContainer.on('hide', this.handleHide);
    glContainer.on('tab', this.handleTab);
    glContainer.on('tabClicked', this.handleTabClicked);
    glEventHub.on(ConsoleEvent.SESSION_CLOSED, this.handleSessionClosed);
    glEventHub.on(ConsoleEvent.SESSION_OPENED, this.handleSessionOpened);
    glEventHub.on(TabEvent.focus, this.handleTabFocus);
    glEventHub.on(TabEvent.blur, this.handleTabBlur);
    glEventHub.on(
      InputFilterEvent.CLEAR_ALL_FILTERS,
      this.handleClearAllFilters
    );

    glEventHub.emit(PanelEvent.MOUNT, componentPanel);
  }

  componentWillUnmount() {
    const { componentPanel, glContainer, glEventHub } = this.props;

    glContainer.off('resize', this.handleResize);
    glContainer.off('show', this.handleBeforeShow);
    glContainer.off('shown', this.handleShow);
    glContainer.off('hide', this.handleHide);
    glContainer.off('tab', this.handleTab);
    glContainer.off('tabClicked', this.handleTabClicked);
    glEventHub.off(ConsoleEvent.SESSION_CLOSED, this.handleSessionClosed);
    glEventHub.off(ConsoleEvent.SESSION_OPENED, this.handleSessionOpened);
    glEventHub.off(TabEvent.focus, this.handleTabFocus);
    glEventHub.off(TabEvent.blur, this.handleTabBlur);
    glEventHub.off(
      InputFilterEvent.CLEAR_ALL_FILTERS,
      this.handleClearAllFilters
    );

    glEventHub.emit(PanelEvent.UNMOUNT, componentPanel);
  }

  handleTab(tab) {
    if (tab) {
      this.setState({
        title: LayoutUtils.getTitleFromTab(tab),
      });
    }
    // render after move can happen before tab event, glTab could be null
    // when tab event is emitted, force a render update
    this.forceUpdate();

    const { onTab } = this.props;
    onTab(tab);
  }

  handleTabClicked(...args) {
    const { onTabClicked } = this.props;
    onTabClicked(...args);
  }

  handleClearAllFilters(...args) {
    const { onClearAllFilters } = this.props;
    onClearAllFilters(...args);
  }

  handleFocus(...args) {
    const { componentPanel, glEventHub } = this.props;
    glEventHub.emit(PanelEvent.FOCUS, componentPanel);

    const { onFocus } = this.props;
    onFocus(...args);
  }

  handleBlur(...args) {
    const { onBlur } = this.props;
    onBlur(...args);
  }

  handleHide(...args) {
    const { onHide } = this.props;
    onHide(...args);
  }

  handleResize(...args) {
    const { onResize } = this.props;
    onResize(...args);
  }

  handleSessionClosed(...args) {
    const { onSessionClose } = this.props;
    onSessionClose(...args);
  }

  handleSessionOpened(...args) {
    const { onSessionOpen } = this.props;
    onSessionOpen(...args);
  }

  handleBeforeShow(...args) {
    const { onBeforeShow } = this.props;
    onBeforeShow(...args);
  }

  handleShow(...args) {
    const { onShow } = this.props;
    onShow(...args);
  }

  handleTabBlur(...args) {
    const { onTabBlur } = this.props;
    onTabBlur(...args);
  }

  handleTabFocus(...args) {
    const { onTabFocus } = this.props;
    onTabFocus(...args);
  }

  handleRenameCancel() {
    this.setState({ showRenameDialog: false });
  }

  handleShowRenameDialog() {
    this.setState({ showRenameDialog: true });
  }

  handleRenameSubmit(newTitle) {
    const { glContainer } = this.props;
    this.setState({ showRenameDialog: false, title: newTitle });
    const root = LayoutUtils.getRootFromContainer(glContainer);
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    LayoutUtils.renameComponent(root, config, newTitle);
  }

  handleCopyPanel() {
    const { glContainer, glEventHub } = this.props;
    const root = LayoutUtils.getRootFromContainer(glContainer);
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    if (config == null) {
      log.error('Could not get component config from container', glContainer);
      return;
    }
    const cloneConfig = LayoutUtils.cloneComponent(root, config);
    if (cloneConfig !== null) {
      glEventHub.emit(PanelEvent.CLONED, this, cloneConfig);
    }
  }

  getCloneAction() {
    return {
      title: 'Copy Panel',
      order: 10,
      group: ContextActions.groups.high,
      action: this.handleCopyPanel,
    };
  }

  getRenameAction() {
    return {
      title: 'Rename',
      order: 10,
      group: ContextActions.groups.medium,
      action: this.handleShowRenameDialog,
    };
  }

  getAdditionActions = memoize((actions, isClonable, isRenamable) => {
    const additionalActions = [];
    if (isClonable) {
      additionalActions.push(this.getCloneAction());
    }
    if (isRenamable) {
      additionalActions.push(this.getRenameAction());
    }
    return [...additionalActions, ...actions];
  });

  render() {
    const {
      children,
      className,
      renderTabTooltip,
      glContainer,
      additionalActions,
      errorMessage,
      isLoaded,
      isLoading,
      isClonable,
      isRenamable,
    } = this.props;
    const { tab: glTab } = glContainer;
    const { showRenameDialog, title } = this.state;

    return (
      <div
        className={classNames('h-100 w-100 iris-panel', className)}
        onFocusCapture={this.handleFocus}
        onBlurCapture={this.handleBlur}
      >
        {children}
        <LoadingOverlay
          errorMessage={errorMessage}
          isLoaded={isLoaded}
          isLoading={isLoading}
        />
        {glTab &&
          ReactDOM.createPortal(
            <>
              <PanelContextMenu
                glContainer={glContainer}
                additionalActions={this.getAdditionActions(
                  additionalActions,
                  isClonable,
                  isRenamable
                )}
              />
              {isRenamable && (
                <RenameDialog
                  isShown={showRenameDialog}
                  value={title}
                  itemType="Panel"
                  onCancel={this.handleRenameCancel}
                  onSubmit={this.handleRenameSubmit}
                />
              )}
              {renderTabTooltip && (
                <Tooltip
                  interactive
                  options={{
                    placement: 'bottom',
                  }}
                  popperClassName="panel-tab-popper"
                >
                  {renderTabTooltip()}
                </Tooltip>
              )}
            </>,
            glTab.element[0] // tab.element is jquery element, we want a dom element
          )}
      </div>
    );
  }
}

Panel.propTypes = {
  componentPanel: PropTypes.instanceOf(Component).isRequired,
  children: PropTypes.node.isRequired,
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  className: PropTypes.string,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onTab: PropTypes.func,
  onTabClicked: PropTypes.func,
  onClearAllFilters: PropTypes.func,
  onHide: PropTypes.func,
  onResize: PropTypes.func,
  onSessionClose: PropTypes.func,
  onSessionOpen: PropTypes.func,
  onBeforeShow: PropTypes.func,
  onShow: PropTypes.func,
  onTabBlur: PropTypes.func,
  onTabFocus: PropTypes.func,
  renderTabTooltip: PropTypes.func,
  additionalActions: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
  errorMessage: PropTypes.string,
  isLoading: PropTypes.bool,
  isLoaded: PropTypes.bool,
  isClonable: PropTypes.bool,
  isRenamable: PropTypes.bool,
};

Panel.defaultProps = {
  className: '',
  onTab: () => {},
  onTabClicked: () => {},
  onClearAllFilters: () => {},
  onFocus: () => {},
  onBlur: () => {},
  onHide: () => {},
  onResize: () => {},
  onSessionClose: () => {},
  onSessionOpen: () => {},
  onBeforeShow: () => {},
  onShow: () => {},
  onTabBlur: () => {},
  onTabFocus: () => {},
  renderTabTooltip: null,
  additionalActions: [],
  errorMessage: null,
  isLoading: false,
  isLoaded: true,
  isClonable: false,
  isRenamable: false,
};

export default Panel;
