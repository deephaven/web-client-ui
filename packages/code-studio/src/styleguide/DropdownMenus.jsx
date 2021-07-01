/* eslint no-alert: "off" */
/* eslint no-console: "off" */
import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContextActions,
  DropdownMenu,
  KEY,
  MODIFIER,
  Shortcut,
} from '@deephaven/components';
import {
  vsBell,
  dhFilePrint,
  vsKebabVertical,
  vsQuestion,
} from '@deephaven/icons';

class DropdownMenus extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isShown: false,
    };
  }

  render() {
    const contextActions = [
      {
        title: `Show Alert`,
        icon: vsBell,
        action: () => {
          alert(`Alert!`);
        },
        shortcut: new Shortcut({
          id: 'STYLEGUIDE.SHOW_ALERT',
          name: 'Show Alert',
          shortcut: [MODIFIER.CTRL, KEY.A],
          macShortcut: [MODIFIER.CMD, KEY.A],
        }),
      },
      {
        title: `Log Message`,
        icon: dhFilePrint,
        action: () => {
          console.log(`Logging a message!`);
        },
        shortcut: new Shortcut({
          id: 'STYLEGUIDE.LOG_MESSAGE',
          name: 'Log Message',
          shortcut: [MODIFIER.CTRL, KEY.L],
          macShortcut: [MODIFIER.CMD, KEY.L],
        }),
      },
    ];

    const globalActions = [
      {
        title: 'Show Shortcuts',
        icon: vsQuestion,
        action: () => {
          alert('Show keyboard shortcuts!');
        },
        shortcut: new Shortcut({
          id: 'STYLEGUIDE.SHOW_SHORTCUTS',
          name: 'Show Shortcuts',
          shortcut: [MODIFIER.CTRL, KEY.SLASH],
          macShortcut: [MODIFIER.CMD, KEY.SLASH],
        }),
        group: ContextActions.groups.global,
      },
    ];

    const actions = globalActions.concat(contextActions);

    const { isShown } = this.state;

    return (
      <div>
        <h2 className="ui-title">Dropdown Menu</h2>
        <p>
          A simple dropdown menu of actions, can open on click of parent
          container, or controlled by prop.
        </p>
        <button type="button" className="btn btn-inline mx-2">
          <FontAwesomeIcon icon={vsKebabVertical} />
          <DropdownMenu actions={actions} />
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{
            marginRight: '1rem',
            minWidth: '165px',
          }}
          onClick={() => {
            if (isShown) {
              this.setState({ isShown: false });
            } else {
              this.setState({ isShown: true });
            }
          }}
        >
          Menu Shown: {isShown.toString()}
        </button>
        <div
          ref={this.button}
          className="btn btn-secondary disabled"
          style={{ marginRight: '1rem' }}
        >
          Shown using isShown
          <DropdownMenu
            isShown={isShown}
            onMenuClosed={() => {
              this.setState({ isShown: false });
            }}
            actions={actions}
          />
        </div>
      </div>
    );
  }
}

export default DropdownMenus;
