import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ContextActions } from '@deephaven/components';
import { GLPropTypes } from '@deephaven/dashboard';

class PanelContextMenu extends PureComponent {
  constructor(props) {
    super(props);

    this.handleCloseTab = this.handleCloseTab.bind(this);
    this.handleCloseTabsRight = this.handleCloseTabsRight.bind(this);
    this.handleCloseTabsAll = this.handleCloseTabsAll.bind(this);
  }

  getAllTabs() {
    // return a clone of the tabs array, or returns empty array if null
    const { glContainer } = this.props;
    return [...(glContainer?.tab?.header?.tabs ?? [])];
  }

  handleCloseTab() {
    const { glContainer } = this.props;
    glContainer.close();
  }

  handleCloseTabsAll() {
    const tabs = this.getAllTabs();

    // No need to check if isClosable, golden-layout returns
    // false when attempting to close tabs that you can't
    tabs.forEach(tab => tab?.contentItem?.container?.close());
  }

  handleCloseTabsRight() {
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
      tabs[i]?.contentItem?.container?.close();
    }
  }

  canCloseTabsRight() {
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
      if (tabs[i]?.contentItem?.config?.isClosable) {
        disabled = false;
        break; // end if we find a closeable tab
      }
    }
    return disabled;
  }

  canCloseAny() {
    const tabs = this.getAllTabs();

    let disabled = true;
    for (let i = tabs.length - 1; i > 0; i -= 1) {
      if (tabs[i]?.contentItem?.config?.isClosable) {
        disabled = false;
        break;
      }
    }
    return disabled;
  }

  render() {
    const { additionalActions, glContainer } = this.props;

    const contextActions = [].concat(additionalActions);

    contextActions.push({
      title: 'Close',
      order: 10,
      group: ContextActions.groups.low,
      action: this.handleCloseTab,
      disabled: !glContainer.tab?.contentItem?.config?.isClosable,
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

PanelContextMenu.propTypes = {
  additionalActions: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
  glContainer: GLPropTypes.Container.isRequired,
};

PanelContextMenu.defaultProps = {
  additionalActions: [],
};

export default PanelContextMenu;
