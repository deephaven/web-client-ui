import React, { Component } from 'react';
import classNames from 'classnames';
import ContextMenu from './ContextMenu';
import ContextActionUtils, { MenuItem } from './ContextActionUtils';

type ContextMenuRootProps = Record<string, never>;

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

    this.container = React.createRef();
    this.handleMenuClose = this.handleMenuClose.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
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
    if (!ContextActionUtils.isContextActionEvent(e)) {
      return;
    }

    if (!this.container.current) {
      return;
    }

    if (e.metaKey || e.ctrlKey) {
      // debug escape hatch to native menu
      return;
    }

    const contextActions = ContextActionUtils.getMenuItems(e.contextActions);

    const parentRect = this.container.current.getBoundingClientRect();
    const top = e.clientY - parentRect.top;
    const left = e.clientX - parentRect.left;

    if (contextActions.length === 0) {
      if (e.target === this.container.current) {
        // re-emit right clicks that hit the context-root blocking layer
        e.preventDefault();

        this.container.current.style.setProperty('pointer-events', 'none'); // temporarily allow clickthrough of the blocking layer
        const element = document.elementFromPoint(left, top); // x y
        this.container.current.style.removeProperty('pointer-events');

        const mouseEvent = new MouseEvent('contextmenu', {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: true,
          cancelable: true,
        });

        element?.dispatchEvent(mouseEvent);

        return;
      }

      const { actions } = this.state;
      if (actions && !this.container.current.contains(e.target as Node)) {
        // Clear re-emitted events to targets with no contextmenu actions
        e.preventDefault();
        this.setState({ actions: null });
        return;
      }

      // target was a menu item
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
