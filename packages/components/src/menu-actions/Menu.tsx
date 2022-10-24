import React, { PureComponent } from 'react';
import ContextActionUtils, {
  ContextAction,
} from '../context-actions/ContextActionUtils';
import ContextMenuItem from '../context-actions/ContextMenuItem';

export type MenuOptions = {
  doNotVerifyPosition?: boolean;
  separateKeyboardMouse?: boolean;
  initialKeyboardIndex?: number;
};

type MenuProps = {
  actions: ContextAction | ContextAction[];
  closeMenu(closeAll: boolean): void;
  onMenuClosed(menu: Menu): void;
  onMenuOpened(menu: Menu): void;
  options: MenuOptions;
  menuStyle: React.CSSProperties;
  'data-testid'?: string;
};

type MenuState = {
  menuItems: ContextAction[];
  keyboardIndex: number;
  mouseIndex: number;
};

/**
 *  Do not use this class directly. Use DropdownMenu instead.
 *
 *  Generates list from actions for use by DropdownMenu.
 *  It has beem split from the context-actions component, due to divergering requirements,
 *  but still re-uses styling from context-menu. Depending on how usage evolves, may get split further.
 *
 */

class Menu extends PureComponent<MenuProps, MenuState> {
  static defaultProps = {
    closeMenu(): void {
      // no-op
    },
    onMenuOpened(): void {
      // no-op
    },
    onMenuClosed(): void {
      // no-op
    },
    options: {},
    menuStyle: {},
    'data-testid': undefined,
  };

  constructor(props: MenuProps) {
    super(props);

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMenuItemClick = this.handleMenuItemClick.bind(this);
    this.handleMenuItemMouseMove = this.handleMenuItemMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleCloseMenu = this.handleCloseMenu.bind(this);

    this.container = React.createRef();
    this.oldFocus = document.activeElement;
    this.rAF = 0;

    const { options } = props;
    const keyboardIndex = options.initialKeyboardIndex ?? -1;

    this.state = {
      menuItems: [],
      keyboardIndex,
      mouseIndex: -1,
    };
  }

  componentDidMount(): void {
    this.initMenu();

    this.rAF = window.requestAnimationFrame(() => {
      // set initial focus to container so keyboard navigation works
      // components can still override focus in onMenuOpened callback
      this.container.current?.focus();
      const { onMenuOpened } = this.props;
      onMenuOpened(this);
    });
  }

  componentDidUpdate(prevProps: MenuProps): void {
    const { actions } = this.props;
    if (prevProps.actions !== actions) {
      this.initMenu();
    }
  }

  componentWillUnmount(): void {
    cancelAnimationFrame(this.rAF);
  }

  container: React.RefObject<HTMLDivElement>;

  oldFocus: Element | null;

  rAF: number;

  getKeyboardIndex(): number | null {
    const { options } = this.props;
    if (
      options.separateKeyboardMouse !== undefined &&
      options.separateKeyboardMouse
    ) {
      const { keyboardIndex } = this.state;
      return keyboardIndex;
    }

    return this.getMouseIndex();
  }

  setKeyboardIndex(index: number): void {
    const { options } = this.props;
    if (
      options.separateKeyboardMouse !== undefined &&
      options.separateKeyboardMouse
    ) {
      this.setState({ keyboardIndex: index });
    } else {
      this.setMouseIndex(index);
    }
  }

  getMouseIndex(): number {
    const { mouseIndex } = this.state;
    return mouseIndex;
  }

  setMouseIndex(index: number): void {
    this.setState({ mouseIndex: index });
  }

  initMenu(): void {
    // cancel any pending close
    cancelAnimationFrame(this.rAF);

    this.setState({
      menuItems: [],
    });

    const { actions } = this.props;
    const menuItems = ContextActionUtils.getMenuItems(actions, false);

    if (menuItems.length > 0) {
      this.setState(state => ({
        menuItems: ContextActionUtils.sortActions(
          state.menuItems.concat(menuItems)
        ),
      }));
    }
  }

  handleKeyDown(e: React.KeyboardEvent): void {
    const { menuItems } = this.state;
    const oldFocus = this.getKeyboardIndex();
    let newFocus = oldFocus;

    if (e.key === 'Enter' || e.key === ' ') {
      if (oldFocus != null && oldFocus >= 0 && oldFocus < menuItems.length) {
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
      newFocus = ContextActionUtils.getNextMenuItem(
        newFocus ?? 0,
        -1,
        menuItems
      );
    } else if (
      e.key === 'ArrowDown' ||
      (e.key === 'Tab' && e.shiftKey === false)
    ) {
      newFocus = ContextActionUtils.getNextMenuItem(
        newFocus ?? 0,
        1,
        menuItems
      );
    }

    if (oldFocus !== newFocus) {
      if (newFocus !== null) {
        this.setKeyboardIndex(newFocus);
      } else {
        this.closeMenu();
        if (this.oldFocus instanceof HTMLElement) {
          this.oldFocus.focus();
        }
      }

      e.preventDefault();
      e.stopPropagation();
    }
  }

  closeMenu(closeAll = false): void {
    const { closeMenu, onMenuClosed } = this.props;
    cancelAnimationFrame(this.rAF);
    this.rAF = window.requestAnimationFrame(() => {
      closeMenu(closeAll);
      onMenuClosed(this);
    });
  }

  handleCloseMenu(): void {
    this.closeMenu();
  }

  handleMenuItemClick(menuItem: ContextAction, e: React.SyntheticEvent): void {
    e.preventDefault();
    e.stopPropagation();

    if (
      menuItem != null &&
      (menuItem.disabled === undefined || !menuItem.disabled) &&
      menuItem.action != null
    ) {
      menuItem.action();
      this.closeMenu(true);
    }
  }

  handleMenuItemMouseMove(menuItem: ContextAction): void {
    const { menuItems } = this.state;
    const focusIndex = menuItems.indexOf(menuItem);
    this.setMouseIndex(focusIndex);
  }

  handleMouseLeave(): void {
    this.setMouseIndex(-1);
  }

  render(): JSX.Element {
    const menuItemElements = [];
    const { 'data-testid': dataTestId } = this.props;
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
          onMenuItemContextMenu={() => false}
        />
      );

      menuItemElements.push(menuItemElement);
    }

    const { menuStyle } = this.props;

    return (
      <div
        className="context-menu-container"
        style={{ ...menuStyle }}
        ref={this.container}
        onKeyDown={this.handleKeyDown}
        onMouseLeave={this.handleMouseLeave}
        role="menuitem"
        tabIndex={0}
        data-testid={dataTestId}
      >
        {menuItemElements}
      </div>
    );
  }
}

export default Menu;
