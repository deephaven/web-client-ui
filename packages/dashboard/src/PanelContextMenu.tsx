import React, { PureComponent, type ReactElement } from 'react';
import {
  ContextActions,
  type ResolvableContextAction,
} from '@deephaven/components';
import type { Container, EventEmitter, Tab } from '@deephaven/golden-layout';
import {
  type CustomizableWorkspace,
  type RootState,
  getWorkspace,
  setWorkspace as setWorkspaceAction,
} from '@deephaven/redux';
import { connect } from 'react-redux';
import { type ClosedPanel } from './PanelManager';
import { LayoutUtils } from './layout';
import { PanelEvent } from './PanelEvent';

interface PanelContextMenuProps {
  additionalActions: ResolvableContextAction[];
  glContainer: Container;
  glEventHub: EventEmitter;
  workspace: CustomizableWorkspace;
}

interface HasContainer {
  container: {
    close: () => void;
  };
}
class PanelContextMenu extends PureComponent<
  PanelContextMenuProps,
  Record<string, never>
> {
  static defaultProps = {
    additionalActions: [],
  };

  constructor(props: PanelContextMenuProps) {
    super(props);

    this.handleCloseTab = this.handleCloseTab.bind(this);
    this.handleCloseTabsRight = this.handleCloseTabsRight.bind(this);
    this.handleCloseTabsAll = this.handleCloseTabsAll.bind(this);
    this.handleReopenLast = this.handleReopenLast.bind(this);
  }

  getAllTabs(): Tab[] {
    // return a clone of the tabs array, or returns empty array if null
    const { glContainer } = this.props;
    return [...(glContainer?.tab?.header?.tabs ?? [])];
  }

  handleCloseTab(): void {
    const { glContainer } = this.props;
    glContainer.close();
  }

  handleCloseTabsAll(): void {
    const tabs = this.getAllTabs();

    // No need to check if isClosable, golden-layout returns
    // false when attempting to close tabs that you can't
    tabs.forEach(
      tab => (tab?.contentItem as unknown as HasContainer).container?.close()
    );
  }

  handleCloseTabsRight(): void {
    const { glContainer } = this.props;
    const tabs = this.getAllTabs();

    for (let i = tabs.length - 1; i > 0; i -= 1) {
      if (
        tabs[i].contentItem?.config?.id ===
        glContainer.tab?.contentItem?.config?.id
      ) {
        break; // end when we get back to current id
      }

      // eslint-disable-next-line no-unused-expressions
      (tabs[i]?.contentItem as unknown as HasContainer).container?.close();
    }
  }

  handleReopenLast(): void {
    const { glContainer, glEventHub } = this.props;
    glEventHub.emit(PanelEvent.REOPEN_LAST, glContainer);
  }

  canCloseTabsRight(): boolean {
    const { glContainer } = this.props;
    const tabs = this.getAllTabs();

    let disabled = true;
    for (let i = tabs.length - 1; i > 0; i -= 1) {
      if (
        tabs[i].contentItem?.config?.id ===
        glContainer.tab?.contentItem?.config?.id
      ) {
        break; // end when we get back to current id
      }
      const closable = Boolean(tabs[i]?.contentItem?.config?.isClosable);
      if (closable) {
        disabled = false;
        break; // end if we find a closeable tab
      }
    }
    return disabled;
  }

  canCloseAny(): boolean {
    const tabs = this.getAllTabs();

    let disabled = true;
    for (let i = tabs.length - 1; i > 0; i -= 1) {
      const closable = Boolean(tabs[i]?.contentItem?.config?.isClosable);
      if (closable) {
        disabled = false;
        break;
      }
    }
    return disabled;
  }

  canReopenLast(): boolean {
    const { workspace, glContainer } = this.props;
    const stackId = LayoutUtils.getStackForConfig(
      glContainer.layoutManager.root,
      glContainer.getConfig()
    )?.config.id;

    return !workspace.data.closed?.some(
      panel => (panel as ClosedPanel).parentStackId === stackId
    );
  }

  render(): ReactElement {
    const { additionalActions, glContainer } = this.props;

    const contextActions = [...additionalActions];

    contextActions.push(() => ({
      title: 'Re-open closed panel',
      group: ContextActions.groups.medium + 2004,
      action: this.handleReopenLast,
      disabled: this.canReopenLast(),
    }));

    const closable = glContainer.tab?.contentItem?.config?.isClosable;
    contextActions.push({
      title: 'Close',
      order: 10,
      group: ContextActions.groups.low,
      action: this.handleCloseTab,
      disabled: closable === undefined || !closable,
    });

    // pushed as function so the disable check happens on run
    contextActions.push(() => ({
      title: 'Close Tabs to Right',
      order: 20,
      group: ContextActions.groups.low,
      action: this.handleCloseTabsRight,
      disabled: this.canCloseTabsRight(),
    }));

    contextActions.push(() => ({
      title: 'Close All',
      order: 30,
      group: ContextActions.groups.low,
      action: this.handleCloseTabsAll,
      disabled: this.canCloseAny(),
    }));

    return <ContextActions actions={contextActions} />;
  }
}

const mapStateToProps = (
  state: RootState
): {
  workspace: CustomizableWorkspace;
} => ({
  workspace: getWorkspace(state),
});

const ConnectedPanelContextMenu = connect(mapStateToProps, {
  setWorkspace: setWorkspaceAction,
})(PanelContextMenu);

export default ConnectedPanelContextMenu;
