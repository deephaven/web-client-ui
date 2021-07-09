import React from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsChevronRight, IconDefinition } from '@deephaven/icons';
import type { ContextAction } from './ContextActionUtils';

interface ContextMenuItemProps {
  children?: React.ReactNode;
  closeMenu(closeAll: boolean): void;
  isKeyboardSelected?: boolean;
  isMouseSelected?: boolean;
  menuItem: ContextAction;
  onMenuItemClick(item: ContextAction, e: React.MouseEvent): void;
  onMenuItemMouseMove(item: ContextAction, e: React.MouseEvent): void;
  onMenuItemContextMenu(item: ContextAction, e: React.MouseEvent): void;
}

const ContextMenuItem = React.forwardRef<HTMLDivElement, ContextMenuItemProps>(
  (props: ContextMenuItemProps, ref) => {
    function handleMenuItemClick(e: React.MouseEvent) {
      const { menuItem, onMenuItemClick } = props;
      onMenuItemClick(menuItem, e);
    }

    function handleMenuItemMouseMove(e: React.MouseEvent) {
      const { menuItem, onMenuItemMouseMove } = props;
      onMenuItemMouseMove(menuItem, e);
    }

    function handleMenuItemContextMenu(e: React.MouseEvent) {
      const { menuItem, onMenuItemContextMenu } = props;
      onMenuItemContextMenu(menuItem, e);
    }

    function renderCustomMenuElement(
      element: React.ReactElement,
      iconElement: IconDefinition | React.ReactElement | null,
      displayShortcut: string | undefined
    ): JSX.Element {
      // Don't pass forwardedProps if menuElement is a native DOM node
      if (typeof element.type === 'string') {
        return element;
      }
      const {
        closeMenu,
        menuItem,
        isKeyboardSelected,
        isMouseSelected,
      } = props;
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

    const displayShortcut = menuItem.shortcut?.getDisplayText();
    let icon: IconDefinition | React.ReactElement | null = null;
    if (menuItem.icon) {
      const menuItemIcon = menuItem.icon;
      if (React.isValidElement(menuItemIcon)) {
        icon = menuItemIcon;
      } else {
        let style: React.CSSProperties | undefined;
        if (menuItem.iconColor && !menuItem.disabled) {
          style = { color: menuItem.iconColor };
        }
        icon = <FontAwesomeIcon icon={menuItemIcon} style={style} />;
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
  }
);

ContextMenuItem.displayName = 'ContextMenuItem';

ContextMenuItem.defaultProps = {
  children: null,
  isKeyboardSelected: false,
  isMouseSelected: false,
};

export default ContextMenuItem;
