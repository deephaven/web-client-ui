/**
 * Just a simple utility class for displaying a popup menu.
 */
import React, { Component } from 'react';
import Log from '@deephaven/log';
import ContextActionUtils, {
  KeyState,
  ContextAction,
  ContextActionEvent,
} from './ContextActionUtils';
import GlobalContextActions from './GlobalContextActions';
import './ContextActions.scss';

const log = Log.module('ContextActions');

interface ContextActionsProps {
  actions: ContextAction[] | (() => ContextAction[]);
}

interface ContextActionsState {
  globalActions: ContextAction[];
  keyboardActions: {
    action: ContextAction;
    keyState: KeyState;
  }[];
}

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
class ContextActions extends Component<
  ContextActionsProps,
  ContextActionsState
> {
  /**
   * Group you can assign to context menu actions to group them together.
   * Lower group IDs appear at the top of the list.
   * Groups are separated by a separator item.
   * Items within groups are ordered by their order property, then by their title.
   */
  static groups = {
    default: null,
    high: 100,
    medium: 5000,
    low: 10000,
    global: 100000,

    edit: 100,
  };

  static triggerMenu(
    element: Element,
    clientX: number,
    clientY: number,
    actions: ContextAction[]
  ): void {
    if (!element || !clientX || !clientY || !actions) {
      return;
    }

    const mouseEvent: Partial<ContextActionEvent> = new MouseEvent(
      'contextmenu',
      {
        clientX,
        clientY,
        bubbles: true,
        cancelable: true,
      }
    );
    mouseEvent.contextActions = actions;

    element.dispatchEvent(mouseEvent as ContextActionEvent);
  }

  constructor(props: ContextActionsProps) {
    super(props);

    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.container = React.createRef();

    this.state = { globalActions: [], keyboardActions: [] };
  }

  static getDerivedStateFromProps(
    props: ContextActionsProps
  ): ContextActionsState {
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

  componentDidMount(): void {
    if (this.container.current?.parentNode) {
      this.container.current.parentElement?.addEventListener(
        'contextmenu',
        this.handleContextMenu
      );
      this.container.current.parentElement?.addEventListener(
        'keydown',
        this.handleKeyDown
      );
    }
  }

  componentWillUnmount(): void {
    if (this.container.current?.parentNode) {
      this.container.current.parentElement?.removeEventListener(
        'contextmenu',
        this.handleContextMenu
      );
      this.container.current.parentElement?.removeEventListener(
        'keydown',
        this.handleKeyDown
      );
    }
  }

  container: React.RefObject<HTMLDivElement>;

  handleContextMenu(e: Event): void {
    if (!ContextActionUtils.isContextActionEvent(e)) {
      return;
    }

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

  handleKeyDown(e: KeyboardEvent): void {
    const { keyboardActions } = this.state;
    for (let i = 0; i < keyboardActions.length; i += 1) {
      const keyboardAction = keyboardActions[i];
      if (ContextActionUtils.isEventForKeyState(e, keyboardAction.keyState)) {
        log.debug('Context hotkey matched!', e);

        const result = keyboardAction.action.action?.(e);

        if (result || result === undefined) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }

        log.debug2('Matched hotkey returned false, key event not consumed');
      }
    }
  }

  render(): JSX.Element {
    const { globalActions } = this.state;
    return (
      <div className="context-actions-listener" ref={this.container}>
        <GlobalContextActions actions={globalActions} />
      </div>
    );
  }
}

export default ContextActions;
