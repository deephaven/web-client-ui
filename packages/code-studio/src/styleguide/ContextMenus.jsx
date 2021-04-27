/* eslint no-alert: "off" */
/* eslint no-console: "off" */
import React, { Component } from 'react';
import { ContextActions } from '@deephaven/components';
import { vsBell, dhFilePrint, vsQuestion } from '@deephaven/icons';

class ContextMenus extends Component {
  constructor(props) {
    super(props);

    this.makeContextMenuItems = this.makeContextMenuItems.bind(this);
  }

  makeContextMenuItems(iteration) {
    const suffix = iteration ? ` ${iteration}` : '';
    return [
      {
        title: `Show Alert${suffix}`,
        icon: vsBell,
        action: () => {
          alert(`Alert${suffix}!`);
        },
        shortcut: '⌃A',
        macShortcut: '⌘A',
      },
      {
        title: `Log Message${suffix}`,
        icon: dhFilePrint,
        action: () => {
          console.log(`Logging a message${suffix}!`);
        },
        shortcut: '⌃L',
        macShortcut: '⌘L',
      },
      {
        title: 'Sub-menu',
        actions: () => this.makeContextMenuItems((iteration || 0) + 1),
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

  render() {
    const contextActions = this.makeContextMenuItems();

    const globalActions = [
      {
        title: 'Show Shortcuts',
        icon: vsQuestion,
        action: () => {
          alert('Show keyboard shortcuts!');
        },
        shortcut: '⌃/',
        macShortcut: '⌘/',
        group: ContextActions.groups.global,
      },
    ];

    const actions = globalActions.concat(contextActions);

    const delayedActions = () =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve(contextActions);
        }, 3000);
      });

    return (
      <div>
        <h2 className="ui-title">Context Menu</h2>
        <button
          type="button"
          className="btn btn-primary"
          style={{
            cursor: 'default',
            marginBottom: '1rem',
            marginRight: '1rem',
          }}
        >
          Right Click Me
          <ContextActions actions={actions} />
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          style={{
            cursor: 'default',
            marginBottom: '1rem',
            marginRight: '1rem',
          }}
        >
          Right Click Me
          <ContextActions actions={delayedActions} />
        </button>
      </div>
    );
  }
}

export default ContextMenus;
