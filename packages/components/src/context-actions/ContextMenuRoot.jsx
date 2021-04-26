import React, { Component } from 'react';
import classNames from 'classnames';
import ContextMenu from './ContextMenu';
import ContextActionUtils from './ContextActionUtils';

/**
 * Put at your root container, any contextmenu events that are unhandled in the root container will be handled by this
 */
class ContextMenuRoot extends Component {
  constructor(props) {
    super(props);

    this.container = null;
    this.handleMenuClose = this.handleMenuClose.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.openMenu = null;

    this.state = {
      actions: null,
      left: 0,
      top: 0,
    };
  }

  componentDidMount() {
    if (this.container.parentNode) {
      this.container.parentNode.addEventListener(
        'contextmenu',
        this.handleContextMenu
      );
    }
  }

  componentWillUnmount() {
    if (this.container.parentNode) {
      this.container.parentNode.removeEventListener(
        'contextmenu',
        this.handleContextMenu
      );
    }
  }

  handleContextMenu(e) {
    if (e.metaKey || e.ctrlKey) {
      // debug escape hatch to native menu
      return;
    }

    const contextActions = ContextActionUtils.getMenuItems(e.contextActions);

    const parentRect = this.container.getBoundingClientRect();
    const top = e.clientY - parentRect.top;
    const left = e.clientX - parentRect.left;

    if (contextActions.length === 0) {
      if (e.target === this.container) {
        // re-emit right clicks that hit the context-root blocking layer
        e.preventDefault();

        this.container.style.setProperty('pointer-events', 'none'); // temporarily allow clickthrough of the blocking layer
        const element = document.elementFromPoint(left, top); // x y
        this.container.style.removeProperty('pointer-events');

        const mouseEvent = new MouseEvent('contextmenu', {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: true,
          cancelable: true,
        });

        element.dispatchEvent(mouseEvent);

        return;
      }

      const { actions } = this.state;
      if (actions && !this.container.contains(e.target)) {
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

  handleMenuClose(menu) {
    if (menu === this.openMenu) {
      this.setState({ actions: null });
    }
  }

  render() {
    let menu = null;
    const { actions, top, left } = this.state;
    if (actions) {
      menu = (
        <ContextMenu
          ref={openMenu => {
            this.openMenu = openMenu;
          }}
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
        ref={container => {
          this.container = container;
        }}
      >
        {menu}
      </div>
    );
  }
}

export default ContextMenuRoot;
