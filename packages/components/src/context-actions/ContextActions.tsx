/**
 * Just a simple utility class for displaying a popup menu.
 */
import React, { Component } from 'react';
import Log from '@deephaven/log';
import ContextActionUtils, {
  ResolvableContextAction,
  isPromise,
} from './ContextActionUtils';
import type { ContextAction, ContextActionEvent } from './ContextActionUtils';
import GlobalContextActions from './GlobalContextActions';
import './ContextActions.scss';

const log = Log.module('ContextActions');

interface ContextActionsProps {
  actions: ResolvableContextAction | ResolvableContextAction[];
  ignoreClassNames?: string[];
  'data-testid'?: string;
}

interface ContextActionsState {
  globalActions: ContextAction[];
  keyboardActions: ContextAction[];
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
 *   shortcut: Shortcut,    // Defaults to null
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
    default: undefined,
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
    if (actions.length === 0) {
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
    if (props.actions == null || !Array.isArray(props.actions)) {
      return { globalActions: [], keyboardActions: [] };
    }
    const globalActions = props.actions.filter(
      action =>
        !isPromise(action) && typeof action !== 'function' && action.isGlobal
    ) as ContextAction[];
    const keyboardActions = props.actions.filter(
      action =>
        !isPromise(action) &&
        typeof action !== 'function' &&
        (action.isGlobal === undefined || !action.isGlobal) &&
        action.shortcut != null
    ) as ContextAction[];

    return { globalActions, keyboardActions };
  }

  componentDidMount(): void {
    if (this.container.current?.parentElement) {
      this.container.current.parentElement.addEventListener(
        'contextmenu',
        this.handleContextMenu
      );
      this.container.current.parentElement.addEventListener(
        'keydown',
        this.handleKeyDown
      );
    }
  }

  componentWillUnmount(): void {
    if (this.container.current?.parentElement) {
      this.container.current.parentElement.removeEventListener(
        'contextmenu',
        this.handleContextMenu
      );
      this.container.current.parentElement.removeEventListener(
        'keydown',
        this.handleKeyDown
      );
    }
  }

  container: React.RefObject<HTMLDivElement>;

  handleContextMenu(e: MouseEvent): void {
    const { ignoreClassNames = [] } = this.props;
    if (ignoreClassNames.length > 0) {
      let el = e.target as Element | null;
      while (el != null) {
        const { classList } = el;
        const ignoredClassName = ignoreClassNames.find(className =>
          classList.contains(className)
        );
        if (ignoredClassName !== undefined) {
          log.debug2(
            `Contextmenu event ignored based on the target className "${ignoredClassName}"`
          );
          return;
        }
        el = el.parentElement;
      }
    }
    if (!ContextActionUtils.isContextActionEvent(e)) {
      (e as ContextActionEvent).contextActions = [];
    }

    if (!ContextActionUtils.isContextActionEvent(e)) {
      return;
    }

    const { actions } = this.props;
    if (actions != null) {
      let contextActions = actions;
      if (Array.isArray(contextActions)) {
        contextActions = contextActions.filter(
          action =>
            isPromise(action) ||
            typeof action === 'function' ||
            action.isGlobal === undefined ||
            !action.isGlobal
        );
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
      if (
        !ContextActionUtils.actionsDisabled &&
        keyboardAction.shortcut != null &&
        keyboardAction.shortcut.matchesEvent(e)
      ) {
        log.debug('Context hotkey matched!', e);

        keyboardAction.action?.(e);

        e.stopPropagation();
        e.preventDefault();

        log.debug2('Matched hotkey returned false, key event not consumed');
      }
    }
  }

  render(): JSX.Element {
    const { 'data-testid': dataTestId } = this.props;
    const { globalActions } = this.state;
    return (
      <div
        className="context-actions-listener"
        ref={this.container}
        data-testid={dataTestId}
      >
        <GlobalContextActions actions={globalActions} />
      </div>
    );
  }
}

export default ContextActions;
