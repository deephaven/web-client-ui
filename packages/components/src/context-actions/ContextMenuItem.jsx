import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsChevronRight } from '@deephaven/icons';
import ContextActionUtils from './ContextActionUtils';

const ContextMenuItem = React.forwardRef((props, ref) => {
  function handleMenuItemClick(e) {
    const { menuItem, onMenuItemClick } = props;
    onMenuItemClick(menuItem, e);
  }

  function handleMenuItemMouseMove(e) {
    const { menuItem, onMenuItemMouseMove } = props;
    onMenuItemMouseMove(menuItem, e);
  }

  function handleMenuItemContextMenu(e) {
    const { menuItem, onMenuItemContextMenu } = props;
    onMenuItemContextMenu(menuItem, e);
  }

  function renderCustomMenuElement(element, iconElement, displayShortcut) {
    // Don't pass forwardedProps if menuElement is a native DOM node
    if (typeof element.type === 'string') {
      return element;
    }
    const { closeMenu, menuItem, isKeyboardSelected, isMouseSelected } = props;
    const forwardedProps = {
      menuItem,
      closeMenu,
      isKeyboardSelected,
      isMouseSelected,
      iconElement,
      displayShortcut,
    };
    return React.cloneElement(element, {
      forwardedProps,
    });
  }

  const { children, menuItem, isKeyboardSelected, isMouseSelected } = props;

  const displayShortcut = ContextActionUtils.getDisplayShortcut(menuItem);
  let icon = null;
  if (menuItem.icon) {
    if (React.isValidElement(menuItem.icon)) {
      ({ icon } = menuItem);
    } else {
      let style = null;
      if (menuItem.iconColor && !menuItem.disabled) {
        style = { color: menuItem.iconColor };
      }
      icon = <FontAwesomeIcon icon={menuItem.icon} style={style} />;
    }
  }

  let subMenuIndicator = null;
  const isSubMenuActive = !!children;
  if (menuItem.actions) {
    subMenuIndicator = <FontAwesomeIcon icon={vsChevronRight} />;
  }
  let content = null;
  if (menuItem.menuElement) {
    content = (
      <div className="custom-menu-item" onMouseMove={handleMenuItemMouseMove}>
        {renderCustomMenuElement(menuItem.menuElement, icon, displayShortcut)}
      </div>
    );
  } else {
    const menuItemDisabled = menuItem.disabled;
    const iconHasOutline = menuItem.iconOutline;
    content = (
      <button
        type="button"
        className={classNames(
          'btn-context-menu',
          { disabled: menuItemDisabled },
          {
            active: (isSubMenuActive || isMouseSelected) && !menuItemDisabled,
          },
          { 'keyboard-active': isKeyboardSelected && !menuItemDisabled }
        )}
        onClick={handleMenuItemClick}
        onMouseMove={handleMenuItemMouseMove}
        onContextMenu={handleMenuItemContextMenu}
        title={menuItem.description || ''}
      >
        <div className="btn-context-menu-wrapper">
          <span className={classNames('icon', { outline: iconHasOutline })}>
            {icon}
          </span>
          <span className="title">{menuItem.title}</span>
          {displayShortcut && (
            <span className="shortcut">{displayShortcut}</span>
          )}
          {subMenuIndicator && (
            <span
              className={classNames('submenu-indicator', {
                disabled: menuItemDisabled,
              })}
            >
              {subMenuIndicator}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="context-menu-item" ref={ref}>
      {children}
      {content}
    </div>
  );
});

ContextMenuItem.displayName = 'ContextMenuItem';

ContextMenuItem.propTypes = {
  children: PropTypes.node,
  closeMenu: PropTypes.func.isRequired,
  isKeyboardSelected: PropTypes.bool,
  isMouseSelected: PropTypes.bool,
  menuItem: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    shortcut: PropTypes.string,
    macShortcut: PropTypes.string,
    icon: PropTypes.oneOfType([
      PropTypes.shape({}), // Font Awesome IconDefinition
      PropTypes.element, // or react element
    ]),
    iconColor: PropTypes.string,
    actions: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.shape({})),
      PropTypes.func,
    ]),
    menuElement: PropTypes.node,
    disabled: PropTypes.bool,
    iconOutline: PropTypes.bool,
  }).isRequired,
  onMenuItemClick: PropTypes.func.isRequired,
  onMenuItemMouseMove: PropTypes.func.isRequired,
  onMenuItemContextMenu: PropTypes.func.isRequired,
};

ContextMenuItem.defaultProps = {
  children: null,
  isKeyboardSelected: false,
  isMouseSelected: false,
};

export default ContextMenuItem;
