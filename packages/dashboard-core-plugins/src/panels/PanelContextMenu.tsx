import React, { PureComponent, ReactElement } from 'react';
import { ContextAction, ContextActions } from '@deephaven/components';
import { Container, Tab } from '@deephaven/golden-layout';

interface PanelContextMenuProps {
  additionalActions: ContextAction[];
  glContainer: Container;
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
    tabs.forEach(tab =>
      ((tab?.contentItem as unknown) as HasContainer).container?.close()
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
      ((tabs[i]?.contentItem as unknown) as HasContainer).container?.close();
    }
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
      const closable = tabs[i]?.contentItem?.config?.isClosable;
      if (closable !== undefined && closable) {
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
      const closable = tabs[i]?.contentItem?.config?.isClosable;
      if (closable !== undefined && closable) {
        disabled = false;
        break;
      }
    }
    return disabled;
  }

  render(): ReactElement {
    const { additionalActions, glContainer } = this.props;

    const contextActions: (ContextAction | (() => ContextAction))[] = [
      ...additionalActions,
    ];

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

export default PanelContextMenu;
