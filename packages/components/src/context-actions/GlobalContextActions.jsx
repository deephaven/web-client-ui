import React, { Component } from 'react';
import PropTypes from 'prop-types';
import GlobalContextAction from './GlobalContextAction';
import ContextActionUtils from './ContextActionUtils';

class GlobalContextActions extends Component {
  render() {
    const { actions } = this.props;
    const actionElements = [];
    for (let i = 0; i < actions.length; i += 1) {
      const action = actions[i];
      const shortcut = ContextActionUtils.getShortcutFromAction(action);
      if (action.title || action.menuElement || shortcut) {
        const actionElement = (
          <GlobalContextAction
            key={`${action.title}.${shortcut}`}
            action={action}
          />
        );
        actionElements.push(actionElement);
      }
    }
    return actionElements;
  }
}

GlobalContextActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      shortcut: PropTypes.string,
      macShortcut: PropTypes.string,
      menuElement: PropTypes.node,
    })
  ).isRequired,
};

export default GlobalContextActions;
