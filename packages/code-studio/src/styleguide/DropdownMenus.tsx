/* eslint-disable react/jsx-props-no-spreading */
/* eslint no-alert: "off" */
/* eslint no-console: "off" */
import React, { Component } from 'react';

import {
  ContextActions,
  DropdownMenu,
  KEY,
  MODIFIER,
  Shortcut,
  DropdownAction,
  Button,
} from '@deephaven/components';
import {
  vsBell,
  dhFilePrint,
  vsKebabVertical,
  vsQuestion,
} from '@deephaven/icons';
import { sampleSectionIdAndClasses } from './utils';

interface DropdownMenus {
  button: React.RefObject<HTMLDivElement>;
}

interface DropdownMenusState {
  isShown: boolean;
}

class DropdownMenus extends Component<
  Record<string, never>,
  DropdownMenusState
> {
  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      isShown: false,
    };
  }

  render(): React.ReactElement {
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
    ] as DropdownAction[];

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
    ] as DropdownAction[];

    const actions = globalActions.concat(contextActions);

    const { isShown } = this.state;

    return (
      <div {...sampleSectionIdAndClasses('dropdown-menus')}>
        <h2 className="ui-title">Dropdown Menu</h2>
        <p>
          A simple dropdown menu of actions, can open on click of parent
          container, or controlled by prop.
        </p>
        <Button
          kind="inline"
          className="mx-2"
          icon={vsKebabVertical}
          onClick={() => undefined}
        >
          <DropdownMenu actions={actions} />
        </Button>
        <Button
          kind="primary"
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
        </Button>
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
