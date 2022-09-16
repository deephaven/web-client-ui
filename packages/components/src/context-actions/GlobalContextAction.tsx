import { Component } from 'react';
import Log from '@deephaven/log';
import ContextActionUtils from './ContextActionUtils';
import type { ContextAction, ContextActionEvent } from './ContextActionUtils';

const log = Log.module('GlobalContextAction');

interface GlobalContextActionProps {
  action: ContextAction;
}

class GlobalContextAction extends Component<GlobalContextActionProps> {
  constructor(props: GlobalContextActionProps) {
    super(props);

    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount(): void {
    document.body.addEventListener('contextmenu', this.handleContextMenu);
    document.body.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount(): void {
    document.body.removeEventListener('contextmenu', this.handleContextMenu);
    document.body.removeEventListener('keydown', this.handleKeyDown);
  }

  handleContextMenu(evt: MouseEvent): void {
    const e = evt as ContextActionEvent;
    if (e.contextActions == null) {
      e.contextActions = [];
    }

    const { action } = this.props;

    if (action.title == null && !action.menuElement) {
      return;
    }

    if (e.contextActions == null) {
      e.contextActions = [];
    }

    e.contextActions.push(action);

    log.debug(
      'Received context menu event at global action! Menu items are now: ',
      e.contextActions
    );
  }

  handleKeyDown(e: KeyboardEvent): void {
    const { action } = this.props;
    if (
      !ContextActionUtils.actionsDisabled &&
      action.shortcut !== undefined &&
      action.shortcut.matchesEvent(e)
    ) {
      log.debug('Global hotkey matched!', e);

      const result = action.action?.(e);

      // result can be any, so I can't assert all the ways it can be truthy
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
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
