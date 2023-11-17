/* eslint-disable react/jsx-props-no-spreading */
/* eslint no-alert: "off" */
/* eslint no-console: "off" */
import React, { Component } from 'react';
import {
  Button,
  ContextActions,
  KEY,
  MODIFIER,
  ResolvableContextAction,
  Shortcut,
} from '@deephaven/components';
import {
  vsBell,
  dhFilePrint,
  vsQuestion,
  IconDefinition,
} from '@deephaven/icons';
import { sampleSectionIdAndClasses } from './utils';

interface ContextMenuItem {
  title: string;
  icon?: IconDefinition;
  action?: () => void;
  shortcut?: Shortcut;
  group?: number;
  order?: number;
  disabled?: boolean;
}

class ContextMenus extends Component {
  constructor(props: Record<string, never>) {
    super(props);

    this.makeContextMenuItems = this.makeContextMenuItems.bind(this);
  }

  makeContextMenuItems(iteration?: number): Array<ContextMenuItem> {
    const suffix = iteration !== undefined ? ` ${iteration}` : '';
    return [
      {
        title: `Show Alert${suffix}`,
        icon: vsBell,
        action: () => {
          alert(`Alert${suffix}!`);
        },
        shortcut: new Shortcut({
          id: 'STYLEGUIDE.SHOW_ALERT',
          name: 'Show Alert',
          shortcut: [MODIFIER.CTRL, KEY.A],
          macShortcut: [MODIFIER.CMD, KEY.A],
        }),
      },
      {
        title: `Log Message${suffix}`,
        icon: dhFilePrint,
        action: () => {
          console.log(`Logging a message${suffix}!`);
        },
        shortcut: new Shortcut({
          id: 'STYLEGUIDE.LOG_MESSAGE',
          name: 'Log Message',
          shortcut: [MODIFIER.CTRL, KEY.L],
          macShortcut: [MODIFIER.CMD, KEY.L],
        }),
      },
      {
        title: 'Sub-menu',
        actions: () => this.makeContextMenuItems((iteration ?? 0) + 1),
        order: 3,
      },
    ].concat(
      new Array(10).fill({
        title: `Disabled Option${suffix}`,
        disabled: true,
        order: 2,
      })
    );
  }

  render(): React.ReactElement {
    const contextActions = this.makeContextMenuItems();

    const globalActions: Array<ContextMenuItem> = [
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

    const delayedActions: ResolvableContextAction = () =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve(contextActions);
        }, 3000);
      });

    return (
      <div {...sampleSectionIdAndClasses('context-menus')}>
        <h2 className="ui-title">Context Menu</h2>
        <Button
          kind="primary"
          style={{
            cursor: 'default',
            marginBottom: '1rem',
            marginRight: '1rem',
          }}
          onClick={() => undefined}
        >
          Right Click Me
          <ContextActions actions={actions} />
        </Button>
        <Button
          kind="tertiary"
          style={{
            cursor: 'default',
            marginBottom: '1rem',
            marginRight: '1rem',
          }}
          onClick={() => undefined}
        >
          Right Click Me
          <ContextActions actions={delayedActions} />
        </Button>
      </div>
    );
  }
}

export default ContextMenus;
