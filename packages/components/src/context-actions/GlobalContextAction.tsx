import { Component } from 'react';
import Log from '@deephaven/log';
import ContextActionUtils, {
  ContextAction,
  KeyState,
} from './ContextActionUtils';

const log = Log.module('GlobalContextAction');

interface GlobalContextActionProps {
  action: ContextAction;
}

class GlobalContextAction extends Component<
  GlobalContextActionProps,
  KeyState
> {
  constructor(props: GlobalContextActionProps) {
    super(props);

    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.state = {
      key: null,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      ctrlKey: false,
    };
  }

  static getDerivedStateFromProps(props: GlobalContextActionProps): KeyState {
    const shortcut = ContextActionUtils.getShortcutFromAction(props.action);
    return ContextActionUtils.getKeyStateFromShortcut(shortcut);
  }

  componentDidMount(): void {
    document.body.addEventListener('contextmenu', this.handleContextMenu, true);
    document.body.addEventListener('keydown', this.handleKeyDown, true);
  }

  componentWillUnmount(): void {
    document.body.removeEventListener(
      'contextmenu',
      this.handleContextMenu,
      true
    );
    document.body.removeEventListener('keydown', this.handleKeyDown, true);
  }

  handleContextMenu(e: Event): void {
    if (!ContextActionUtils.isContextActionEvent(e)) {
      return;
    }

    const { action } = this.props;

    if (!action.title && !action.menuElement) {
      return;
    }

    if (!e.contextActions) {
      e.contextActions = [];
    }

    e.contextActions.push(action);

    log.debug(
      'Received context menu event at global action! Menu items are now: ',
      e.contextActions
    );
  }

  handleKeyDown(e: KeyboardEvent): void {
    if (ContextActionUtils.isEventForKeyState(e, this.state)) {
      log.debug('Global hotkey matched!', e);

      const { action } = this.props;
      const result = action.action?.(e);

      if (result || result === undefined) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  render(): null {
    return null;
  }
}

export default GlobalContextAction;
