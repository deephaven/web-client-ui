import React, { PureComponent } from 'react';
import classNames from 'classnames';
import Log from '@deephaven/log';
import { PromiseUtils, CancelablePromise } from '@deephaven/utils';
import ContextActionUtils, {
  ContextAction,
  ResolvableContextAction,
} from './ContextActionUtils';
import ContextMenuItem from './ContextMenuItem';
import LoadingSpinner from '../LoadingSpinner';

const log = Log.module('ContextMenu');

interface ContextMenuProps {
  top: number;
  left: number;
  updatePosition(top: number, left: number): void;
  // only submenus will have these, defaults to 0 otherwise
  // represents the width height of the parent menu item
  subMenuParentWidth: number;
  subMenuParentHeight: number;
  actions: ResolvableContextAction[];
  closeMenu(closeAll: boolean): void;
  onMenuClosed(menu: ContextMenu): void;
  onMenuOpened(menu: ContextMenu): void;
  options: {
    doNotVerifyPosition?: boolean;
    separateKeyboardMouse?: boolean;
    initialKeyboardIndex?: number;
  };
  menuStyle: React.CSSProperties;
}

interface ContextMenuState {
  menuItems: ContextAction[];
  pendingItems: CancelablePromise<ContextAction[]>[];
  activeSubMenu: number | null;
  hasOverflow: boolean;
  subMenuTop: number | null;
  subMenuLeft: number | null;
  subMenuParentWidth: number;
  subMenuParentHeight: number;
  keyboardIndex: number;
  mouseIndex: number;
}

/** Do not use this class directly. Use ContextMenuRoot and ContextActions instead. */
class ContextMenu extends PureComponent<ContextMenuProps, ContextMenuState> {
  static defaultProps = {
    subMenuParentWidth: 0,
    subMenuParentHeight: 0,
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
  };

  static handleContextMenu(e: React.MouseEvent): void {
    if (e.metaKey) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
  }

  constructor(props: ContextMenuProps) {
    super(props);

    this.handleBlur = this.handleBlur.bind(this);
    this.handleCloseSubMenu = this.handleCloseSubMenu.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMenuItemClick = this.handleMenuItemClick.bind(this);
    this.handleMenuItemContextMenu = this.handleMenuItemContextMenu.bind(this);
    this.handleMenuItemMouseMove = this.handleMenuItemMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);

    this.container = React.createRef();
    this.oldFocus = document.activeElement;
    this.activeSubMenuRef = React.createRef();
    this.subMenuTimer = 0;
    this.rAF = 0;

    this.initialPosition = { top: props.top, left: props.left };

    this.state = {
      menuItems: [],
      pendingItems: [],
      activeSubMenu: null,
      hasOverflow: false,
      subMenuTop: null,
      subMenuLeft: null,
      subMenuParentWidth: 0,
      subMenuParentHeight: 0,
      keyboardIndex: -1,
      mouseIndex: -1,
    };
  }

  componentDidMount(): void {
    this.initMenu();

    this.verifyPosition();

    window.addEventListener('resize', this.handleWindowResize);

    // rAF is needed to wait for a submenus popper to be created before
    // attempting to set focus, however on a quick mount/unmount when
    // mousing past an item, the submenu could be unmounted before the
    // async rAF finishes, so it is cancelled in willUnmount()
    this.rAF = window.requestAnimationFrame(() => {
      this.container.current?.focus();

      const { onMenuOpened } = this.props;
      onMenuOpened(this);
    });
  }

  componentDidUpdate(
    prevProps: ContextMenuProps,
    prevState: ContextMenuState
  ): void {
    const { actions } = this.props;
    const { activeSubMenu } = this.state;

    if (activeSubMenu !== prevState.activeSubMenu) {
      if (activeSubMenu == null) {
        // close sub menu, refocus parent menu
        this.container.current?.focus();
      } else {
        // open sub menu, set its initial position
        this.setActiveSubMenuPosition();
      }
    }

    if (prevProps.actions !== actions) {
      this.initMenu();

      if (!this.container.current?.contains(document.activeElement)) {
        this.container.current?.focus();
      }
    }

    this.verifyPosition();
  }

  componentWillUnmount(): void {
    this.cancelPromises();
    window.removeEventListener('resize', this.handleWindowResize);
    cancelAnimationFrame(this.rAF);
  }

  container: React.RefObject<HTMLDivElement>;

  oldFocus: Element | null;

  activeSubMenuRef: React.RefObject<HTMLDivElement>;

  subMenuTimer: number;

  rAF: number;

  initialPosition: { top: number; left: number };

  getKeyboardIndex(): number {
    const { options } = this.props;
    if (options.separateKeyboardMouse) {
      const { keyboardIndex } = this.state;
      return keyboardIndex;
    }

    return this.getMouseIndex();
  }

  setKeyboardIndex(index: number): void {
    const { options } = this.props;
    if (options.separateKeyboardMouse) {
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
    // cancel any pending close and promises
    this.cancelPromises();
    cancelAnimationFrame(this.rAF);

    const { options } = this.props;
    let keyboardIndex = options.initialKeyboardIndex;
    if (keyboardIndex === undefined) {
      keyboardIndex = -1;
    }

    const { actions } = this.props;
    const menuItems = ContextActionUtils.getMenuItems(actions);
    const nonPromiseItems: ContextAction[] = [];
    for (let i = menuItems.length - 1; i >= 0; i -= 1) {
      const menuItem = menuItems[i];
      if (menuItem instanceof Promise) {
        this.initMenuPromise(menuItem as Promise<ContextAction[]>);
      } else {
        nonPromiseItems.push(menuItem as ContextAction);
      }
    }

    this.setState({
      mouseIndex: -1,
      keyboardIndex,
      activeSubMenu: null,
      menuItems: ContextActionUtils.sortActions(nonPromiseItems),
    });
  }

  initMenuPromise(promise: Promise<ContextAction[]>): void {
    // make all promises cancellable
    const cancellablePromise = PromiseUtils.makeCancelable(promise);

    this.setState(state => ({
      pendingItems: state.pendingItems.concat(cancellablePromise),
    }));

    cancellablePromise.then(
      resolvedMenuItems => {
        this.setState(state => {
          const index = state.pendingItems.indexOf(cancellablePromise);
          if (index >= 0) {
            const pendingItems = state.pendingItems.slice();
            pendingItems.splice(index, 1);

            return {
              menuItems: ContextActionUtils.sortActions(
                state.menuItems.concat(resolvedMenuItems)
              ),
              pendingItems,
            };
          }
          // This item is stale, don't update the menu
          return null;
        });
      },
      error => {
        if (PromiseUtils.isCanceled(error)) {
          return; // Canceled promise is ignored
        }

        // remove failed item from pending list
        this.setState(state => {
          const index = state.pendingItems.indexOf(cancellablePromise);
          if (index >= 0) {
            const pendingItems = state.pendingItems.slice();
            pendingItems.splice(index, 1);
            return {
              pendingItems,
            };
          }
          return null;
        });

        // Log the error
        log.error(error);
      }
    );
  }

  cancelPromises(): void {
    const { pendingItems } = this.state;
    pendingItems.map(item => item.cancel());
  }

  /**
   * Sets the unverfied start position of a submenu. Submenu then self-verfies
   * its own position and potentially reports back a new position.
   */
  setActiveSubMenuPosition(): void {
    if (this.activeSubMenuRef.current === null) return;
    const parentRect = this.activeSubMenuRef.current.getBoundingClientRect();

    // intentionally rect.right, we want the sub menu to start at the right edge of the current menu
    this.setState({
      subMenuTop: parentRect.top,
      subMenuLeft: parentRect.right,
      subMenuParentHeight: parentRect.height,
      subMenuParentWidth: parentRect.width,
    });
  }

  /**
   * Verifies the position of this menu in relation to the parent to make sure it's on screen.
   * Will update the top left state (updatePosition) if necessary (causing a re-render)
   * By default it tries to top-align with parent, at the right side of the parent.
   * Because we aren't a native context menu and can't escape window bounds, we also do
   * somethings to better fit on screen, such as the "nudge" offset position, and further
   * allow overflow scrolling for large menus in a small window.
   */
  verifyPosition(): void {
    const {
      options,
      updatePosition,
      subMenuParentWidth,
      subMenuParentHeight,
      top: oldTop,
      left: oldLeft,
    } = this.props;

    if (!this.container.current || options.doNotVerifyPosition) {
      return;
    }

    // initial position is used rather than current position,
    // as the number of menu items can change (actions can bubble)
    // and menu should always be positioned relative to spawn point
    let { top, left } = this.initialPosition;
    const {
      width,
      height,
    } = this.container.current?.getBoundingClientRect() ?? {
      width: 0,
      height: 0,
    };
    const hasOverflow =
      (this.container.current?.scrollHeight ?? 0) > window.innerHeight;

    if (height === 0 || width === 0) {
      // We don't have a height or width yet, don't bother doing anything
      return;
    }

    // does it fit below?
    if (top + height > window.innerHeight) {
      // can it be flipped to above? include offset if submenu (defaults to 0 if not submenu)
      if (top - height - subMenuParentHeight > 0) {
        // flip like a native menu would
        top -= height - subMenuParentHeight;
      } else {
        // still doesnt fit? okay, position at bottom edge
        top = window.innerHeight - height;
      }
    }

    if (left + width > window.innerWidth) {
      // less picky about left right positioning, just keep it going off to right
      left = left - width - subMenuParentWidth;
    }

    if (oldLeft !== left || oldTop !== top) {
      // parent owns positioning as single source of truth, ask to update props
      this.setState({ hasOverflow });
      updatePosition(top, left);
    }
  }

  // since window resize doesn't trigger blur, listen and close the menu
  handleWindowResize(): void {
    if (!this.container.current) {
      return;
    }
    this.closeMenu(true);
  }

  handleBlur(e: React.FocusEvent<HTMLDivElement>): void {
    if (!this.container.current) {
      log.warn('Container is null!');
      return;
    }

    if (!this.container.current.contains(e.relatedTarget as Node)) {
      let element: HTMLElement | null = e.relatedTarget as HTMLElement;
      let isContextMenuChild = false;
      while (element && !isContextMenuChild) {
        isContextMenuChild = element.hasAttribute('data-dh-context-menu');
        element = element.parentElement;
      }

      if (!isContextMenuChild) {
        // close all submenus on blur
        this.closeMenu(true);
      }
    }
  }

  /** Returns whether the specified key should remove the menu. Depends on the side the parent is on. */
  isEscapeKey(key: string): boolean {
    const { left } = this.props;
    return (
      key === 'Escape' ||
      (left < 0 && key === 'ArrowRight') ||
      key === 'ArrowLeft'
    );
  }

  handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    const { menuItems } = this.state;
    const oldFocus = this.getKeyboardIndex();
    let newFocus: number | null = oldFocus;
    let openSubMenu = false;

    if (e.key === 'Enter' || e.key === ' ') {
      if (oldFocus >= 0 && oldFocus < menuItems.length) {
        this.handleMenuItemClick(
          menuItems[oldFocus],
          (e as React.SyntheticEvent) as React.MouseEvent
        );
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      if (oldFocus >= 0 && oldFocus <= menuItems.length) {
        openSubMenu = true;
      } else {
        newFocus = 0;
      }
    } else if (this.isEscapeKey(e.key)) {
      newFocus = null;
    } else if (e.key === 'ArrowUp' || (e.shiftKey && e.key === 'Tab')) {
      newFocus = ContextActionUtils.getNextMenuItem(newFocus, -1, menuItems);
    } else if (e.key === 'ArrowDown' || e.key === 'Tab') {
      newFocus = ContextActionUtils.getNextMenuItem(newFocus, 1, menuItems);
    }

    if (openSubMenu) {
      this.openSubMenu(oldFocus);
      e.preventDefault();
      e.stopPropagation();
      return;
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

  openSubMenu(index: number): void {
    const { menuItems, activeSubMenu } = this.state;
    if (activeSubMenu === index) return;
    this.setState({
      activeSubMenu: menuItems[index].actions ? index : null,
      subMenuTop: null,
      subMenuLeft: null,
    });
  }

  closeMenu(closeAll = false): void {
    const { closeMenu, onMenuClosed } = this.props;
    cancelAnimationFrame(this.rAF);
    this.rAF = window.requestAnimationFrame(() => {
      closeMenu(closeAll);
      onMenuClosed(this);
    });
  }

  closeSubMenu(): void {
    this.setState({
      activeSubMenu: null,
    });
  }

  handleCloseSubMenu(closeAllMenus: boolean): void {
    if (closeAllMenus) {
      this.closeMenu(true);
    } else {
      this.closeSubMenu();
    }
  }

  handleMenuItemClick(menuItem: ContextAction, e: React.MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    const { menuItems } = this.state;
    if (menuItem != null && !menuItem.disabled) {
      if (menuItem.actions != null) {
        this.openSubMenu(menuItems.indexOf(menuItem));
      } else if (menuItem.action != null) {
        menuItem.action();
        this.closeMenu(true);
      }
    }
  }

  handleMenuItemContextMenu(
    menuItem: ContextAction,
    e: React.MouseEvent
  ): void {
    if (e.metaKey) {
      return;
    }

    this.handleMenuItemClick(menuItem, e);
  }

  handleMenuItemMouseMove(menuItem: ContextAction): void {
    const { menuItems } = this.state;
    const focusIndex = menuItems.indexOf(menuItem);
    this.setMouseIndex(focusIndex);

    if (
      focusIndex >= 0 &&
      focusIndex < menuItems.length &&
      !menuItem.disabled
    ) {
      this.openSubMenu(focusIndex);
    }
  }

  handleMouseLeave(): void {
    this.setMouseIndex(-1);
  }

  render(): JSX.Element {
    const menuItemElements = [];
    const { top, left } = this.props;
    const {
      activeSubMenu,
      hasOverflow,
      keyboardIndex,
      menuItems,
      mouseIndex,
      pendingItems,
      subMenuTop,
      subMenuLeft,
      subMenuParentWidth,
      subMenuParentHeight,
    } = this.state;
    for (let i = 0; i < menuItems.length; i += 1) {
      const menuItem = menuItems[i];

      if (i > 0 && menuItem.group !== menuItems[i - 1].group) {
        menuItemElements.push(<hr key={`${i}.separator`} />);
      }

      const menuItemElement = (
        <ContextMenuItem
          key={i}
          ref={activeSubMenu === i ? this.activeSubMenuRef : null}
          isKeyboardSelected={keyboardIndex === i}
          isMouseSelected={mouseIndex === i}
          menuItem={menuItem}
          closeMenu={this.handleCloseSubMenu}
          onMenuItemClick={this.handleMenuItemClick}
          onMenuItemMouseMove={this.handleMenuItemMouseMove}
          onMenuItemContextMenu={this.handleMenuItemContextMenu}
        />
      );

      menuItemElements.push(menuItemElement);
    }

    let pendingElement = null;
    if (pendingItems.length > 0) {
      pendingElement = (
        <div className="loading">
          <LoadingSpinner />
        </div>
      );
    }

    const { menuStyle } = this.props;

    // don't show submenu until it has an position initialized
    const showSubmenu =
      activeSubMenu !== null && subMenuTop !== null && subMenuLeft !== null;

    return (
      <>
        <div
          className={classNames(
            { 'has-overflow': hasOverflow },
            'context-menu-container'
          )}
          style={{ top, left, ...menuStyle }}
          ref={this.container}
          data-dh-context-menu
          onBlur={this.handleBlur}
          onKeyDown={this.handleKeyDown}
          onMouseLeave={this.handleMouseLeave}
          onContextMenu={ContextMenu.handleContextMenu}
          role="menuitem"
          tabIndex={0}
        >
          {menuItemElements}
          {pendingElement}
        </div>
        {showSubmenu && activeSubMenu && subMenuTop && subMenuLeft && (
          <ContextMenu
            key={`sub-${activeSubMenu}`}
            actions={menuItems[activeSubMenu].actions || []}
            closeMenu={this.handleCloseSubMenu}
            top={subMenuTop}
            left={subMenuLeft}
            updatePosition={(verifiedTop, verifiedLeft) => {
              this.setState({
                subMenuTop: verifiedTop,
                subMenuLeft: verifiedLeft,
              });
            }}
            subMenuParentWidth={subMenuParentWidth}
            subMenuParentHeight={subMenuParentHeight}
          />
        )}
      </>
    );
  }
}

export default ContextMenu;
