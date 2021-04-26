import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from 'react';
import classNames from 'classnames';
import { DropdownMenu } from '@deephaven/components';
import {
  dhInput,
  dhFilterSlash,
  dhTriangleDownSquare,
  vsLink,
  vsMarkdown,
} from '@deephaven/icons';
import PropTypes from 'prop-types';
import ControlType from '../controls/ControlType';
import ToolType from '../tools/ToolType';

const MINIMUM_DRAG_DISTANCE = 10;

/**
 * helper component that renders a menu item
 * props are fowarded from ContextMenuItem
 * purpose is to add custom mouse handlers
 * for dragging panels directly from menu
 */

const DragSourceMenuItem = props => {
  const {
    forwardedProps: {
      menuItem: { action, title, disabled: menuItemDisabled },
      iconElement,
      displayShortcut,
      isMouseSelected,
      isKeyboardSelected,
      closeMenu,
    },
  } = props;

  const startX = useRef();
  const startY = useRef();
  const startObject = useRef(null);

  // used to prevent double clicking inserting an object twice
  const [disableDoubleClick, setDisableDoubleClick] = useState(false);

  const handleMouseMove = useCallback(
    event => {
      if (
        startObject.current &&
        (Math.abs(startX.current - event.clientX) >= MINIMUM_DRAG_DISTANCE ||
          Math.abs(startY.current - event.clientY) >= MINIMUM_DRAG_DISTANCE)
      ) {
        setDisableDoubleClick(true);
        window.removeEventListener('mousemove', handleMouseMove);
        closeMenu();
        action(event);
        startObject.current = null; // null object so mouseUp can't fire
      }
    },
    [action, closeMenu]
  );

  function handleMouseDown(event) {
    startX.current = event.clientX;
    startY.current = event.clientY;
    startObject.current = event.target;
    window.addEventListener('mousemove', handleMouseMove);
  }

  function handleMouseUp(event) {
    // down and up need to occur on same object to constitute a click event
    if (startObject.current === event.target) {
      setDisableDoubleClick(true);
      closeMenu();
      action();
      window.removeEventListener('mousemove', handleMouseMove);
    }
    startObject.current = null; // null object so mousemove can't fire3
  }

  useEffect(
    // funny syntax after prettier, return function for the cleanup function
    () => () => {
      window.removeEventListener('mousemove', handleMouseMove);
    },
    [handleMouseMove]
  );

  return (
    <button
      type="button"
      className={classNames(
        'btn-context-menu',
        { disabled: menuItemDisabled },
        {
          active: isMouseSelected && !menuItemDisabled,
        },
        { 'keyboard-active': isKeyboardSelected && !menuItemDisabled }
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={disableDoubleClick}
    >
      <span className={classNames('icon')}>{iconElement}</span>
      <span className="title">{title}</span>
      <span className="shortcut">{displayShortcut}</span>
    </button>
  );
};

const AppControlsMenu = props => {
  const { handleControlSelect, handleToolSelect, onClearFilter } = props;
  const controlMenuActions = useMemo(
    () => [
      {
        title: 'Input Filter',
        icon: dhInput,
        menuElement: <DragSourceMenuItem />,
        action: (dragEvent = null) => {
          handleControlSelect(ControlType.INPUT_FILTER, dragEvent);
        },
        order: 10,
      },
      {
        title: 'Dropdown Filter',
        icon: dhTriangleDownSquare,
        menuElement: <DragSourceMenuItem />,
        action: (dragEvent = null) => {
          handleControlSelect(ControlType.DROPDOWN_FILTER, dragEvent);
        },
        order: 15,
      },
      {
        title: 'Markdown Widget',
        icon: vsMarkdown,
        menuElement: <DragSourceMenuItem />,
        action: (dragEvent = null) => {
          handleControlSelect(ControlType.MARKDOWN, dragEvent);
        },
        order: 20,
      },
      {
        disabled: true,
        menuElement: <div className="context-menu-group-header">Tools</div>,
        order: 30,
      },
      {
        title: 'Linker',
        icon: vsLink,
        action: () => {
          handleToolSelect(ToolType.LINKER);
        },
        order: 40,
        shortcut: '⌃L',
        macShortcut: '⌘L',
      },
      {
        disabled: true,
        menuElement: <div className="context-menu-group-header">Actions</div>,
        order: 50,
      },
      {
        title: 'Clear All Filters',
        icon: dhFilterSlash,
        action: () => {
          onClearFilter();
        },
        order: 60,
        shortcut: '⌃E',
        macShortcut: '⌘E',
      },
    ],
    [handleControlSelect, handleToolSelect, onClearFilter]
  );

  return (
    <DropdownMenu
      popperClassName="controls-menu-popper"
      actions={controlMenuActions}
    />
  );
};

AppControlsMenu.propTypes = {
  handleControlSelect: PropTypes.func,
  handleToolSelect: PropTypes.func,
  onClearFilter: PropTypes.func,
};

AppControlsMenu.defaultProps = {
  handleControlSelect: () => {},
  handleToolSelect: () => {},
  onClearFilter: () => {},
};

DragSourceMenuItem.propTypes = {
  forwardedProps: PropTypes.shape({
    iconElement: PropTypes.node,
    displayShortcut: PropTypes.string,
    isMouseSelected: PropTypes.bool.isRequired,
    isKeyboardSelected: PropTypes.bool.isRequired,
    closeMenu: PropTypes.func.isRequired,
    menuItem: PropTypes.shape({
      action: PropTypes.func,
      title: PropTypes.string,
      disabled: PropTypes.bool,
    }).isRequired,
  }),
};

DragSourceMenuItem.defaultProps = {
  forwardedProps: null,
};

export default AppControlsMenu;
