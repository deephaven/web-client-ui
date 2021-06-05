/**
 * Add dropdown menu that you add onto any component.
 *
 * Similar to the context-actions package, accepts list of actions to create a dropdown menu.
 * Note: Does not support nested sub-menus.
 *
 * Usage:
 * let actions = [{
 *   title: 'My Action',
 *   action: () => { alert('My Action Clicked!') }
 *   icon: faPrint,         // Limited to FontAwesome icons for now.
 *   shortcut: '⌃M',        // Defaults to null.  Modifiers must be first.
 *   macShortcut: '⌘M',     // Mac specific shortcut. Defaults to null.
 *   group: ContextActions.groups.default,  // What group to group the context action with
 *   order: null                            // Int where to order within group
 * }];
 *
 * Usage:
 * 1. Auto bind click to open event to parent
 * <div>
 *   Click in this container
 *   <DropdownMenu actions={actions}/>
 * </div>
 *
 * 2. Control via prop
 * <div>
 *   DropdownMenu will not react to the click event if isShown prop is used
 *   <DropdownMenu actions={actions} isShown={isShown} />
 * </div>
 *
 */
import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { PopperOptions } from 'popper.js';
import { Popper } from '../popper';
import Menu, { MenuOptions } from './Menu';
import { ContextAction } from '../context-actions/ContextActionUtils';
import './DropdownMenu.scss';

type DropdownMenuProps = {
  // Override to prevent nested lists
  actions:
    | (ContextAction & { actions?: never })
    | (ContextAction & { actions?: never })[];
  isShown: boolean | null;
  onMenuClosed(): void;
  onMenuOpened(): void;
  options: MenuOptions;
  popperOptions: PopperOptions;
  popperClassName: string;
  menuStyle: React.CSSProperties;
};

class DropdownMenu extends PureComponent<DropdownMenuProps> {
  static defaultProps = {
    isShown: null,
    onMenuClosed(): void {
      // no-op
    },
    onMenuOpened(): void {
      // no-op
    },
    options: {},
    popperOptions: {},
    popperClassName: '',
    menuStyle: {},
  };

  constructor(props: DropdownMenuProps) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleCloseMenu = this.handleCloseMenu.bind(this);
    this.handleExited = this.handleExited.bind(this);

    this.container = React.createRef();
    this.parent = null;
    this.popper = React.createRef();

    this.isOpen = false;
  }

  componentDidMount(): void {
    const { isShown } = this.props;

    if (isShown === null) {
      if (this.container.current?.parentElement) {
        this.parent = this.container.current.parentElement;
        this.parent.addEventListener('click', this.handleClick);
      }
    } else if (isShown) {
      this.openMenu();
    }
  }

  componentDidUpdate(prevProps: DropdownMenuProps): void {
    const { isShown } = this.props;

    if (prevProps.isShown !== isShown) {
      if (isShown) {
        // https://github.com/reactjs/react-transition-group/issues/382
        window.requestAnimationFrame(() => {
          this.openMenu();
        });
      } else {
        this.closeMenu();
      }
    }
  }

  componentWillUnmount(): void {
    if (this.parent) {
      this.parent.removeEventListener('click', this.handleClick);
    }
  }

  container: React.RefObject<HTMLDivElement>;

  parent: Element | null;

  popper: React.RefObject<Popper>;

  isOpen: boolean;

  closeMenu(): void {
    this.popper.current?.hide();
  }

  openMenu(): void {
    if (this.popper.current && !this.isOpen) {
      this.popper.current.show();
      this.isOpen = true;
    }
  }

  scheduleUpdate(): void {
    this.popper.current?.scheduleUpdate();
  }

  handleClick(e: Event): void {
    e.preventDefault();
    e.stopPropagation();

    this.openMenu();
  }

  handleCloseMenu(): void {
    this.closeMenu();
  }

  handleExited(): void {
    this.isOpen = false;

    const { onMenuClosed } = this.props;
    onMenuClosed();
  }

  render(): JSX.Element {
    const { actions, onMenuOpened, popperClassName } = this.props;
    const { menuStyle } = this.props;
    let { options, popperOptions } = this.props;
    popperOptions = { placement: 'bottom', ...popperOptions };
    options = {
      separateKeyboardMouse: true,
      ...options,
    };
    return (
      <div className="menu-actions-listener" ref={this.container}>
        <Popper
          ref={this.popper}
          options={popperOptions}
          className={classNames('menu-popper', popperClassName)}
          onExited={this.handleExited}
          closeOnBlur
          interactive
        >
          <Menu
            actions={actions}
            closeMenu={this.handleCloseMenu}
            onMenuOpened={onMenuOpened}
            options={options}
            menuStyle={menuStyle}
          />
        </Popper>
      </div>
    );
  }
}

export default DropdownMenu;
