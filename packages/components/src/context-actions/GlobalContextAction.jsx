import { Component } from 'react';
import PropTypes from 'prop-types';
import Log from '@deephaven/log';
import ContextActionUtils from './ContextActionUtils';

const log = Log.module('GlobalContextAction');

class GlobalContextAction extends Component {
  constructor(props) {
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

  static getDerivedStateFromProps(props) {
    const shortcut = ContextActionUtils.getShortcutFromAction(props.action);
    return ContextActionUtils.getKeyStateFromShortcut(shortcut);
  }

  componentDidMount() {
    document.body.addEventListener('contextmenu', this.handleContextMenu, true);
    document.body.addEventListener('keydown', this.handleKeyDown, true);
  }

  componentWillUnmount() {
    document.body.removeEventListener(
      'contextmenu',
      this.handleContextMenu,
      true
    );
    document.body.removeEventListener('keydown', this.handleKeyDown, true);
  }

  handleContextMenu(e) {
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

  handleKeyDown(e) {
    if (ContextActionUtils.isEventForKeyState(e, this.state)) {
      log.debug('Global hotkey matched!', e);

      const { action } = this.props;
      const result = action.action(e);

      if (result || result === undefined) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  render() {
    return null;
  }
}

GlobalContextAction.propTypes = {
  action: PropTypes.shape({
    title: PropTypes.string,
    shortcut: PropTypes.string,
    macShortcut: PropTypes.string,
    action: PropTypes.func,
    menuElement: PropTypes.node,
  }).isRequired,
};

export default GlobalContextAction;
