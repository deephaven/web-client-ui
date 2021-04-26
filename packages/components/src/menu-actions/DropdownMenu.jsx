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
import PropTypes from 'prop-types';
import { Popper } from '../popper';
import Menu from './Menu';
import './DropdownMenu.scss';

class DropdownMenu extends PureComponent {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleCloseMenu = this.handleCloseMenu.bind(this);
    this.handleExited = this.handleExited.bind(this);

    this.container = null;
    this.parent = null;
    this.popper = null;

    this.isOpen = false;
  }

  componentDidMount() {
    const { isShown } = this.props;

    if (isShown === null) {
      if (this.container.parentNode) {
        this.parent = this.container.parentNode;
        this.parent.addEventListener('click', this.handleClick);
      }
    } else if (isShown) {
      this.openMenu();
    }
  }

  componentDidUpdate(prevProps) {
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

  componentWillUnmount() {
    if (this.parent) {
      this.parent.removeEventListener('click', this.handleClick);
    }
  }

  closeMenu() {
    if (this.popper) {
      this.popper.hide();
    }
  }

  openMenu() {
    if (this.popper && !this.isOpen) {
      this.popper.show();
      this.isOpen = true;
    }
  }

  scheduleUpdate() {
    if (this.popper) {
      this.popper.scheduleUpdate();
    }
  }

  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    this.openMenu();
  }

  handleCloseMenu() {
    this.closeMenu();
  }

  handleExited() {
    this.isOpen = false;

    const { onMenuClosed } = this.props;
    onMenuClosed();
  }

  render() {
    const { actions, onMenuOpened, popperClassName } = this.props;
    const { menuStyle } = this.props;
    let { options, popperOptions } = this.props;
    popperOptions = { placement: 'bottom', ...popperOptions };
    options = {
      separateKeyboardMouse: true,
      ...options,
    };
    return (
      <div
        className="menu-actions-listener"
        ref={container => {
          this.container = container;
        }}
      >
        <Popper
          ref={popper => {
            this.popper = popper;
          }}
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

DropdownMenu.propTypes = {
  actions: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.func,
    PropTypes.shape({}),
  ]).isRequired,
  isShown: PropTypes.bool,
  onMenuClosed: PropTypes.func,
  onMenuOpened: PropTypes.func,
  options: PropTypes.shape({}),
  popperOptions: PropTypes.shape({}),
  popperClassName: PropTypes.string,
  menuStyle: PropTypes.shape({}),
};

DropdownMenu.defaultProps = {
  isShown: null,
  onMenuClosed: () => {},
  onMenuOpened: () => {},
  options: {},
  popperOptions: {},
  popperClassName: '',
  menuStyle: {},
};

export default DropdownMenu;
