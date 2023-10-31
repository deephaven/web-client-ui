import React, {
  FocusEvent,
  FocusEventHandler,
  PureComponent,
  ReactElement,
  ReactNode,
} from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import memoize from 'memoize-one';
import {
  ContextAction,
  ContextActions,
  LoadingOverlay,
  Tooltip,
} from '@deephaven/components';
import {
  Container,
  EventEmitter,
  ReactComponentConfig,
  Tab,
} from '@deephaven/golden-layout';
import { assertNotNull } from '@deephaven/utils';
import Log from '@deephaven/log';
import PanelContextMenu from './PanelContextMenu';
import RenameDialog from './RenameDialog';
import PanelEvent, { ComponentPanel } from './PanelEvent';
import { LayoutUtils } from '../layout';

const log = Log.module('Panel');

export interface ComponentPanelProps {
  componentPanel: ComponentPanel;
  children: ReactNode;
  glContainer: Container;
  glEventHub: EventEmitter;
  className: string;
  onFocus: FocusEventHandler<HTMLDivElement>;
  onBlur: FocusEventHandler<HTMLDivElement>;
  onTab: (tab: Tab) => void;
  onTabClicked: (e: MouseEvent) => void;
  onHide: (...args: unknown[]) => void;
  onResize: (...args: unknown[]) => void;
  onBeforeShow: (...args: unknown[]) => void;
  onShow: (...args: unknown[]) => void;
  renderTabTooltip: () => ReactNode;
  additionalActions: ContextAction[];
  errorMessage: string;
  isLoading: boolean;
  isLoaded: boolean;
  isClonable: boolean;
  isRenamable: boolean;
}

interface PanelState {
  title?: string | null;
  showRenameDialog: boolean;
  isWithinPanel: boolean;
}
/**
 * Generic panel component that emits mount/unmount/focus events.
 * Also wires up some triggers for common events:
 * Focus, Resize, Show, Session open/close, client disconnect/reconnect.
 */
class Panel extends PureComponent<ComponentPanelProps, PanelState> {
  static defaultProps = {
    className: '',
    onTab: (): void => undefined,
    onTabClicked: (): void => undefined,
    onFocus: (): void => undefined,
    onBlur: (): void => undefined,
    onHide: (): void => undefined,
    onResize: (): void => undefined,
    onBeforeShow: (): void => undefined,
    onShow: (): void => undefined,
    renderTabTooltip: null,
    additionalActions: [],
    errorMessage: null,
    isLoading: false,
    isLoaded: true,
    isClonable: false,
    isRenamable: false,
  };

  constructor(props: ComponentPanelProps) {
    super(props);

    this.handleCopyPanel = this.handleCopyPanel.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleHide = this.handleHide.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleBeforeShow = this.handleBeforeShow.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handleRenameCancel = this.handleRenameCancel.bind(this);
    this.handleRenameSubmit = this.handleRenameSubmit.bind(this);
    this.handleShowRenameDialog = this.handleShowRenameDialog.bind(this);
    this.handleTabClicked = this.handleTabClicked.bind(this);
    this.handleTab = this.handleTab.bind(this);

    this.ref = React.createRef<HTMLDivElement>();

    const { glContainer } = this.props;
    this.state = {
      title: LayoutUtils.getTitleFromContainer(glContainer),
      showRenameDialog: false,
      isWithinPanel: true,
    };
  }

  componentDidMount(): void {
    const { glContainer } = this.props;

    glContainer.on('resize', this.handleResize);
    glContainer.on('show', this.handleBeforeShow);
    glContainer.on('shown', this.handleShow);
    glContainer.on('hide', this.handleHide);
    glContainer.on('tab', this.handleTab);
    glContainer.on('tabClicked', this.handleTabClicked);

    this.setState({
      isWithinPanel:
        this.ref.current?.parentElement?.closest('.dh-panel') != null,
    });
  }

  componentDidUpdate(prevProps: ComponentPanelProps): void {
    const { componentPanel, glEventHub } = this.props;

    // componentPanel ref could start undefined w/ WidgetLoaderPlugin wrapping panels
    if (prevProps.componentPanel == null && componentPanel != null) {
      glEventHub.emit(PanelEvent.MOUNT, componentPanel);
    }
  }

  componentWillUnmount(): void {
    const { componentPanel, glContainer, glEventHub } = this.props;

    glContainer.off('resize', this.handleResize);
    glContainer.off('show', this.handleBeforeShow);
    glContainer.off('shown', this.handleShow);
    glContainer.off('hide', this.handleHide);
    glContainer.off('tab', this.handleTab);
    glContainer.off('tabClicked', this.handleTabClicked);

    if (componentPanel != null) {
      glEventHub.emit(PanelEvent.UNMOUNT, componentPanel);
    }
  }

  ref: React.RefObject<HTMLDivElement>;

  handleTab(tab: Tab): void {
    if (tab != null) {
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

  handleTabClicked(e: MouseEvent): void {
    const { onTabClicked } = this.props;
    onTabClicked(e);
  }

  handleFocus(event: FocusEvent<HTMLDivElement>): void {
    const { componentPanel, glEventHub } = this.props;
    glEventHub.emit(PanelEvent.FOCUS, componentPanel);

    const { onFocus } = this.props;
    onFocus(event);
  }

  handleBlur(event: FocusEvent<HTMLDivElement>): void {
    const { onBlur } = this.props;
    onBlur(event);
  }

  handleHide(...args: unknown[]): void {
    const { onHide } = this.props;
    onHide(...args);
  }

  handleResize(...args: unknown[]): void {
    const { onResize } = this.props;
    onResize(...args);
  }

  handleBeforeShow(...args: unknown[]): void {
    const { onBeforeShow } = this.props;
    onBeforeShow(...args);
  }

  handleShow(...args: unknown[]): void {
    const { onShow } = this.props;
    onShow(...args);
  }

  handleRenameCancel(): void {
    this.setState({ showRenameDialog: false });
  }

  handleShowRenameDialog(): void {
    this.setState({ showRenameDialog: true });
  }

  handleRenameSubmit(newTitle: string): void {
    const { glContainer } = this.props;
    this.setState({ showRenameDialog: false, title: newTitle });
    const root = LayoutUtils.getRootFromContainer(glContainer);
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    assertNotNull(config);
    LayoutUtils.renameComponent(root, config, newTitle);
  }

  handleCopyPanel(): void {
    const { glContainer, glEventHub } = this.props;
    const root = LayoutUtils.getRootFromContainer(glContainer);
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    if (config == null) {
      log.error('Could not get component config from container', glContainer);
      return;
    }
    const cloneConfig = LayoutUtils.cloneComponent(
      root,
      config as ReactComponentConfig
    );
    if (cloneConfig !== null) {
      glEventHub.emit(PanelEvent.CLONED, this, cloneConfig);
    }
  }

  getCloneAction(): ContextAction {
    return {
      title: 'Copy Panel',
      order: 10,
      group: ContextActions.groups.high,
      action: this.handleCopyPanel,
    };
  }

  getRenameAction(): ContextAction {
    return {
      title: 'Rename',
      order: 10,
      group: ContextActions.groups.medium,
      action: this.handleShowRenameDialog,
    };
  }

  getAdditionActions = memoize(
    (actions: ContextAction[], isClonable: boolean, isRenamable: boolean) => {
      const additionalActions = [];
      if (isClonable) {
        additionalActions.push(this.getCloneAction());
      }
      if (isRenamable) {
        additionalActions.push(this.getRenameAction());
      }
      return [...additionalActions, ...actions];
    }
  );

  render(): ReactElement {
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
    const { showRenameDialog, title, isWithinPanel } = this.state;

    return (
      <div
        className={classNames('h-100 w-100 dh-panel', className)}
        onFocusCapture={this.handleFocus}
        onBlurCapture={this.handleBlur}
        ref={this.ref}
      >
        {children}
        <LoadingOverlay
          errorMessage={errorMessage}
          isLoaded={isLoaded}
          isLoading={isLoading}
        />
        {!isWithinPanel &&
          glTab != null &&
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
              {renderTabTooltip != null && (
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

export default Panel;
