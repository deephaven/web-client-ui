import React, { Component } from 'react';
import GlobalContextAction from './GlobalContextAction';
import type { ContextAction } from './ContextActionUtils';

interface GlobalContextActionsProps {
  actions: ContextAction[];
}

class GlobalContextActions extends Component<GlobalContextActionsProps> {
  render(): React.ReactNode {
    const { actions } = this.props;
    const actionElements = [];
    for (let i = 0; i < actions.length; i += 1) {
      const action = actions[i];
      const { shortcut } = action;
      if (action.title || action.menuElement || shortcut) {
        const actionElement = (
          <GlobalContextAction
            key={`${action.title}.${shortcut?.id}`}
            action={action}
          />
        );
        actionElements.push(actionElement);
      }
    }
    return actionElements;
  }
}

export default GlobalContextActions;
