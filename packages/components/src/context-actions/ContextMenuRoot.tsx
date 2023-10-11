import React, { Component } from 'react';
import classNames from 'classnames';
import ContextMenu from './ContextMenu';
import ContextActionUtils, { MenuItem } from './ContextActionUtils';

type ContextMenuRootProps = Record<string, never> & {
  'data-testid'?: string;
};

interface ContextMenuRootState {
  actions: MenuItem[] | null;
  left: number;
  top: number;
}

/**
 * Put at your root container, any contextmenu events that are unhandled in the root container will be handled by this
 */
class ContextMenuRoot extends Component<
  ContextMenuRootProps,
  ContextMenuRootState
> {
  constructor(props: ContextMenuRootProps) {
    super(props);

    this.handleMenuClose = this.handleMenuClose.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.container = React.createRef();
    this.openMenu = React.createRef();

    this.state = {
      actions: null,
      left: 0,
      top: 0,
    };
  }

  componentDidMount(): void {
    if (this.container.current?.parentElement) {
      this.container.current.parentElement.addEventListener(
        'contextmenu',
        this.handleContextMenu
      );
    }
  }

  componentWillUnmount(): void {
    if (this.container.current?.parentElement) {
      this.container.current.parentElement.removeEventListener(
        'contextmenu',
        this.handleContextMenu
      );
    }
  }

  container: React.RefObject<HTMLDivElement>;

  openMenu: React.RefObject<ContextMenu>;

  handleContextMenu(e: MouseEvent): void {
    if (!this.container.current) {
      return;
    }

    const parentRect = this.container.current.getBoundingClientRect();
    const top = e.clientY - parentRect.top;
    const left = e.clientX - parentRect.left;
    const { actions } = this.state;

    // Context menu is open and user clicked on the context-root blocking layer
    // Mac and Linux appear to trigger contextmenu events on mousedown vs. mouseup on Windows
    // Mouseup on Windows triggers blur before contextmenu which effectively does what this path does
    if (actions != null && e.target === this.container.current) {
      // re-emit right clicks that hit the context-root blocking layer
      // while we already have a custom context menu open
      e.preventDefault();

      // Set actions to null removes the menu
      // That allows a new menu to be opened on a different element so initial position is set properly
      // Otherwise the instance of this menu may be reused
      // A new contextmenu event is triggered on the element at the location the user clicked on the blocking layer
      this.setState({ actions: null }, () => {
        const element = document.elementFromPoint(left, top); // x y

        const mouseEvent = new MouseEvent('contextmenu', {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: true,
          cancelable: true,
        });

        element?.dispatchEvent(mouseEvent);
      });
      return;
    }

    if (!ContextActionUtils.isContextActionEvent(e)) {
      // Open native menu if no custom context actions
      return;
    }

    if (e.metaKey || e.ctrlKey) {
      // debug escape hatch to native menu
      return;
    }

    const contextActions = ContextActionUtils.getMenuItems(e.contextActions);

    if (contextActions.length === 0) {
      // No actions after filtering. Use native menu
      return;
    }

    // new clicks, set actions
    e.preventDefault();
    this.setState({
      actions: contextActions,
      top,
      left,
    });
  }

  handleMenuClose(menu: ContextMenu): void {
    if (menu === this.openMenu.current) {
      this.setState({ actions: null });
    }
  }

  render(): JSX.Element {
    let menu = null;
    const { 'data-testid': dataTestId } = this.props;
    const { actions, top, left } = this.state;
    if (actions) {
      menu = (
        <ContextMenu
          ref={this.openMenu}
          actions={actions}
          onMenuClosed={this.handleMenuClose}
          top={top}
          left={left}
          updatePosition={(verifiedTop, verifiedLeft) => {
            this.setState({ top: verifiedTop, left: verifiedLeft });
          }}
          data-testid={dataTestId}
        />
      );
    }
    return (
      <div
        className={classNames('context-menu-root', { active: actions })}
        ref={this.container}
      >
        {menu}
      </div>
    );
  }
}

export default ContextMenuRoot;
