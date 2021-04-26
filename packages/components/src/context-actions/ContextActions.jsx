/**
 * Just a simple utility class for displaying a popup menu.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Log from '@deephaven/log';
import ContextActionUtils from './ContextActionUtils';
import GlobalContextActions from './GlobalContextActions';
import './ContextActions.scss';

const log = Log.module('ContextActions');

/**
 * ContextActions that you add onto any component.
 *
 * Usage:
 * let actions = [{
 *   title: 'My Action',  // Omit the title to hide it from the context menu
 *   action: () => { alert('My Action Clicked!') }
 *   actions: []            // Submenu of actions
 *   icon: faPrint,         // Limited to FontAwesome icons for now.
 *   iconColor: '#ff0000,   // Color to use for the icon
 *   shortcut: '⌃M',        // Defaults to null. Modifiers must be first.
 *   macShortcut: '⌘M',     // Specific shortcut for mac platforms. Defaults to null. Falls back to shortcut.
 *   isGlobal: false,       // Global context action. Defaults to false.
 *   group: ContextActions.groups.default,  // What group to group the context action with
 *   order: null,                           // Int where to order within group
 *   disabled: true         // disable action
 *   menuElement: null      // Custom menu element for displaying in context menu. When null, creates a default menu item based on title
 * }];
 *
 * <div>
 *   Right click in this container
 *   <ContextActions actions={actions}/>
 * </div>
 *
 * Right clicking the container will then build the context menu, bubbling up until an element with a ContextMenuRoot is on it.
 * You should generally have a ContextMenuRoot on the root node of your document.
 */
class ContextActions extends Component {
  static triggerMenu(element, clientX, clientY, actions) {
    if (!element || !clientX || !clientY || !actions) {
      return;
    }

    const mouseEvent = new MouseEvent('contextmenu', {
      clientX,
      clientY,
      bubbles: true,
      cancelable: true,
    });
    mouseEvent.contextActions = actions;

    element.dispatchEvent(mouseEvent);
  }

  constructor(props) {
    super(props);

    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.container = null;

    this.state = { globalActions: [] };
  }

  static getDerivedStateFromProps(props) {
    if (!props.actions || !Array.isArray(props.actions)) {
      return { globalActions: [], keyboardActions: [] };
    }
    const globalActions = props.actions.filter(action => action.isGlobal);
    const keyboardActions = props.actions
      .filter(
        action =>
          !action.isGlobal &&
          ContextActionUtils.getShortcutFromAction(action) != null
      )
      .map(action => {
        const shortcut = ContextActionUtils.getShortcutFromAction(action);
        return {
          action,
          keyState: ContextActionUtils.getKeyStateFromShortcut(shortcut),
        };
      });

    return { globalActions, keyboardActions };
  }

  componentDidMount() {
    if (this.container.parentNode) {
      this.container.parentNode.addEventListener(
        'contextmenu',
        this.handleContextMenu
      );
      this.container.parentNode.addEventListener('keydown', this.handleKeyDown);
    }
  }

  componentWillUnmount() {
    if (this.container.parentNode) {
      this.container.parentNode.removeEventListener(
        'contextmenu',
        this.handleContextMenu
      );
      this.container.parentNode.removeEventListener(
        'keydown',
        this.handleKeyDown
      );
    }
  }

  handleContextMenu(e) {
    if (!e.contextActions) {
      e.contextActions = [];
    }

    const { actions } = this.props;
    if (actions) {
      let contextActions = actions;
      if (Array.isArray(contextActions)) {
        contextActions = contextActions.filter(action => !action.isGlobal);
      }

      e.contextActions = e.contextActions.concat(contextActions);
    }

    log.debug(
      'Received context menu event! Menu items are now: ',
      e.contextActions
    );
  }

  handleKeyDown(e) {
    const { keyboardActions } = this.state;
    for (let i = 0; i < keyboardActions.length; i += 1) {
      const keyboardAction = keyboardActions[i];
      if (ContextActionUtils.isEventForKeyState(e, keyboardAction.keyState)) {
        log.debug('Context hotkey matched!', e);

        const result = keyboardAction.action.action(e);

        if (result || result === undefined) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }

        log.debug2('Matched hotkey returned false, key event not consumed');
      }
    }
  }

  render() {
    const { globalActions } = this.state;
    return (
      <div
        className="context-actions-listener"
        ref={container => {
          this.container = container;
        }}
      >
        <GlobalContextActions actions={globalActions} />
      </div>
    );
  }
}

/**
 * Group you can assign to context menu actions to group them together.
 * Lower group IDs appear at the top of the list.
 * Groups are separated by a separator item.
 * Items within groups are ordered by their order property, then by their title.
 */
ContextActions.groups = {
  default: null,
  high: 100,
  medium: 5000,
  low: 10000,
  global: 100000,

  edit: 100,
};

ContextActions.propTypes = {
  actions: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
};

export default ContextActions;
