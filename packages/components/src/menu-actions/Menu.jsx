import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ContextActionUtils from '../context-actions/ContextActionUtils';
import ContextMenuItem from '../context-actions/ContextMenuItem';

/**
 *  Do not use this class directly. Use DropdownMenu instead.
 *
 *  Generates list from actions for use by DropdownMenu.
 *  It has beem split from the context-actions component, due to divergering requirements,
 *  but still re-uses styling from context-menu. Depending on how usage evolves, may get split further.
 *
 */

class Menu extends PureComponent {
  constructor(props) {
    super(props);

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMenuItemClick = this.handleMenuItemClick.bind(this);
    this.handleMenuItemMouseMove = this.handleMenuItemMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleCloseMenu = this.handleCloseMenu.bind(this);

    this.container = null;
    this.oldFocus = document.activeElement;
    this.rAF = null;

    const { options } = props;
    let keyboardIndex = options.initialKeyboardIndex;
    if (!Number.isInteger(keyboardIndex)) {
      keyboardIndex = -1;
    }

    this.state = {
      menuItems: [],
      keyboardIndex,
      mouseIndex: -1,
    };
  }

  componentDidMount() {
    this.initMenu();

    this.rAF = window.requestAnimationFrame(() => {
      // set initial focus to container so keyboard navigation works
      // components can still override focus in onMenuOpened callback
      this.container.focus();
      const { onMenuOpened } = this.props;
      onMenuOpened(this);
    });
  }

  componentDidUpdate(prevProps) {
    const { actions } = this.props;
    if (prevProps.actions !== actions) {
      this.initMenu();
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rAF);
  }

  getKeyboardIndex() {
    const { options } = this.props;
    if (options.separateKeyboardMouse) {
      const { keyboardIndex } = this.state;
      return keyboardIndex;
    }

    return this.getMouseIndex();
  }

  setKeyboardIndex(index) {
    const { options } = this.props;
    if (options.separateKeyboardMouse) {
      this.setState({ keyboardIndex: index });
    } else {
      this.setMouseIndex(index);
    }
  }

  getMouseIndex() {
    const { mouseIndex } = this.state;
    return mouseIndex;
  }

  setMouseIndex(index) {
    this.setState({ mouseIndex: index });
  }

  initMenu() {
    // cancel any pending close
    cancelAnimationFrame(this.rAF);

    this.setState({
      menuItems: [],
    });

    const { actions } = this.props;
    const menuItems = ContextActionUtils.getMenuItems(actions);

    this.setState(state => {
      const newState = {};

      if (menuItems.length > 0) {
        newState.menuItems = ContextActionUtils.sortActions(
          state.menuItems.concat(menuItems)
        );
      }

      return newState;
    });
  }

  handleKeyDown(e) {
    const { menuItems } = this.state;
    const oldFocus = this.getKeyboardIndex();
    let newFocus = oldFocus;

    if (e.key === 'Enter' || e.key === ' ') {
      if (oldFocus >= 0 && oldFocus < menuItems.length) {
        this.handleMenuItemClick(menuItems[oldFocus], e);
      }
      return;
    }

    if (e.key === 'Escape') {
      newFocus = null;
    } else if (
      e.key === 'ArrowUp' ||
      (e.key === 'Tab' && e.shiftKey === true)
    ) {
      newFocus = ContextActionUtils.getNextMenuItem(newFocus, -1, menuItems);
    } else if (
      e.key === 'ArrowDown' ||
      (e.key === 'Tab' && e.shiftKey === false)
    ) {
      newFocus = ContextActionUtils.getNextMenuItem(newFocus, 1, menuItems);
    }

    if (oldFocus !== newFocus) {
      if (newFocus !== null) {
        this.setKeyboardIndex(newFocus);
      } else {
        this.closeMenu();
        if (this.oldFocus && this.oldFocus.focus) {
          this.oldFocus.focus();
        }
      }

      e.preventDefault();
      e.stopPropagation();
    }
  }

  closeMenu() {
    const { closeMenu, onMenuClosed } = this.props;
    cancelAnimationFrame(this.rAF);
    this.rAF = window.requestAnimationFrame(() => {
      closeMenu();
      onMenuClosed(this);
    });
  }

  handleCloseMenu() {
    this.closeMenu();
  }

  handleMenuItemClick(menuItem, e) {
    e.preventDefault();
    e.stopPropagation();

    if (menuItem != null && !menuItem.disabled && menuItem.action != null) {
      menuItem.action();
      this.closeMenu(true);
    }
  }

  handleMenuItemMouseMove(menuItem) {
    const { menuItems } = this.state;
    const focusIndex = menuItems.indexOf(menuItem);
    this.setMouseIndex(focusIndex);
  }

  handleMouseLeave() {
    this.setMouseIndex(-1);
  }

  render() {
    const menuItemElements = [];
    const { keyboardIndex, menuItems, mouseIndex } = this.state;
    for (let i = 0; i < menuItems.length; i += 1) {
      const menuItem = menuItems[i];

      if (i > 0 && menuItem.group !== menuItems[i - 1].group) {
        menuItemElements.push(<hr key={`${i}.separator`} />);
      }

      const menuItemElement = (
        <ContextMenuItem
          key={i}
          isKeyboardSelected={keyboardIndex === i}
          isMouseSelected={mouseIndex === i}
          menuItem={menuItem}
          closeMenu={this.handleCloseMenu}
          onMenuItemClick={this.handleMenuItemClick}
          onMenuItemMouseMove={this.handleMenuItemMouseMove}
          onMenuItemContextMenu={() => {}}
        />
      );

      menuItemElements.push(menuItemElement);
    }

    const { menuStyle } = this.props;

    return (
      <div
        className="context-menu-container"
        style={{ ...menuStyle }}
        ref={container => {
          this.container = container;
        }}
        onKeyDown={this.handleKeyDown}
        onMouseLeave={this.handleMouseLeave}
        role="menuitem"
        tabIndex="0"
      >
        {menuItemElements}
      </div>
    );
  }
}

Menu.propTypes = {
  actions: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.func,
    PropTypes.shape({}),
  ]).isRequired,
  closeMenu: PropTypes.func,
  onMenuClosed: PropTypes.func,
  onMenuOpened: PropTypes.func,
  options: PropTypes.shape({
    doNotVerifyPosition: PropTypes.bool,
    separateKeyboardMouse: PropTypes.bool,
    initialKeyboardIndex: PropTypes.number,
  }),
  menuStyle: PropTypes.shape({}),
};

Menu.defaultProps = {
  closeMenu: () => {},
  onMenuOpened: () => {},
  onMenuClosed: () => {},
  options: {},
  menuStyle: {},
};

export default Menu;
