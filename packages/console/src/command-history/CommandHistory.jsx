import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  ContextActions,
  ContextActionUtils,
  ItemList,
  SearchInput,
  GLOBAL_SHORTCUTS,
} from '@deephaven/components';
import {
  vsFileCode,
  vsFiles,
  vsNewFile,
  vsPlay,
  vsTerminal,
} from '@deephaven/icons';
import { Pending } from '@deephaven/utils';
import Log from '@deephaven/log';
import CommandHistoryItem from './CommandHistoryItem';
import CommandHistoryActions from './CommandHistoryActions';
import ConsoleConstants from '../common/ConsoleConstants';

import './CommandHistory.scss';
import StoragePropTypes from '../StoragePropTypes';
import CommandHistoryViewportUpdater from './CommandHistoryViewportUpdater';
import SHORTCUTS from '../ConsoleShortcuts';

const log = Log.module('CommandHistory');

class CommandHistory extends Component {
  static ITEM_HEIGHT = 29;

  static MAX_SELECTION_COUNT = 10000;

  static menuGroups = {
    send: ContextActions.groups.medium + 100,
  };

  static getCommandsFromViewport(items, offset, sortedRanges) {
    const commands = [];
    for (let i = 0; i < sortedRanges.length; i += 1) {
      const range = sortedRanges[i];
      for (let j = range[0]; j <= range[1]; j += 1) {
        if (j >= offset && j < offset + items.length) {
          const { name } = items[j - offset];
          commands.push(name);
        }
      }
    }
    return commands;
  }

  static async getCommandsFromSnapshot(table, sortedRanges) {
    const items = await table.getSnapshot(sortedRanges);
    return [...items.values()].map(item => item.name);
  }

  constructor(props) {
    super(props);

    this.copySelectedCommands = this.copySelectedCommands.bind(this);
    this.createNotebook = this.createNotebook.bind(this);
    this.sendToConsole = this.sendToConsole.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.runInConsole = this.runInConsole.bind(this);
    this.sendToNotebook = this.sendToNotebook.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleViewportChange = this.handleViewportChange.bind(this);
    this.handleViewportUpdate = this.handleViewportUpdate.bind(this);

    this.itemActions = [
      {
        title: 'Copy Selection',
        description: 'Copy selected commands to clipboard',
        icon: vsFiles,
        shortcut: GLOBAL_SHORTCUTS.COPY,
        action: this.copySelectedCommands,
        group: ContextActions.groups.edit,
      },
      {
        title: 'Send to Console',
        description: 'Open selected commands in the console',
        icon: vsTerminal,
        shortcut: SHORTCUTS.COMMAND_HISTORY.SEND_TO_CONSOLE,
        action: this.sendToConsole,
        group: CommandHistory.menuGroups.send,
        order: 10,
      },
      {
        title: 'Run in Console',
        description: 'Run selected commands in the console',
        icon: vsPlay,
        shortcut: SHORTCUTS.COMMAND_HISTORY.RUN,
        action: this.runInConsole,
        group: CommandHistory.menuGroups.send,
        order: 10,
      },
      {
        title: 'Send to Active Notebook',
        description: 'Open selected commands in a notebook',
        icon: vsFileCode,
        shortcut: SHORTCUTS.COMMAND_HISTORY.SEND_TO_NOTEBOOK,
        action: this.sendToNotebook,
        group: CommandHistory.menuGroups.send,
        order: 20,
      },
      {
        title: 'Send to New Notebook',
        description: 'Open selected commands in a new notebook',
        icon: vsNewFile,
        action: this.createNotebook,
        group: CommandHistory.menuGroups.send,
        order: 30,
      },
    ];

    this.historyActions = [
      {
        title: 'Send to Console',
        icon: vsTerminal,
        selectionRequired: true,
        description: 'Open selected commands in the console',
        action: this.sendToConsole,
      },
      {
        title: 'Send to Notebook',
        icon: vsFileCode,
        selectionRequired: true,
        description: 'Open selected commands in a notebook',
        action: this.sendToNotebook,
      },
    ];

    this.pending = new Pending();
    this.searchInputRef = React.createRef();

    const { table } = props;

    this.state = {
      actions: [],
      historyActions: this.historyActions,
      top: 0,
      bottom: 0,
      itemCount: table.size,
      items: [],
      offset: 0,
      selectedRanges: [],
      searchText: '',
    };
  }

  componentWillUnmount() {
    this.pending.cancel();
  }

  /**
   * Retrieves the selected commands as an array.
   * If they're not within the current viewport, will fetch them from the table
   * @returns {Promise<string[]>} Array of selected commands
   */
  async getSelectedCommands() {
    const { items, offset, selectedRanges } = this.state;
    const ranges = selectedRanges.slice().sort((a, b) => a[0] - b[0]);

    if (ranges.length === 0) {
      return [];
    }
    if (
      ranges[0][0] >= offset &&
      ranges[ranges.length - 1][1] < offset + items.length
    ) {
      // All ranges are in the current viewport, just copy the data we've already got
      return CommandHistory.getCommandsFromViewport(items, offset, ranges);
    }
    const { table } = this.props;
    return this.pending.add(
      CommandHistory.getCommandsFromSnapshot(table, ranges)
    );
  }

  /**
   * Retrieves the text of all the currently selected commands, joined by a new line char
   * @returns {Promise<string>} The commands joined by \n char
   */
  getSelectedCommandText() {
    return this.getSelectedCommands().then(commands => commands.join('\n'));
  }

  updateActions() {
    this.setState(state => {
      const { selectedRanges } = state;
      const selectedRowCount = selectedRanges.reduce(
        (count, range) => count + range[1] - range[0] + 1,
        0
      );
      if (
        selectedRowCount > 0 &&
        selectedRowCount < CommandHistory.MAX_SELECTION_COUNT
      ) {
        log.debug('Updating actions', this.itemActions);
        return { actions: this.itemActions };
      }
      log.debug('Disabling actions', selectedRowCount);
      return { actions: [] };
    });
  }

  copySelectedCommands() {
    this.getSelectedCommandText()
      .then(ContextActionUtils.copyToClipboard)
      .catch(log.error);
  }

  createNotebook() {
    this.getSelectedCommandText()
      .then(commandText => {
        const { language, sendToNotebook } = this.props;
        sendToNotebook({ value: commandText, language }, true);
      })
      .catch(log.error);
  }

  sendToNotebook() {
    this.getSelectedCommandText()
      .then(commandText => {
        const { language, sendToNotebook } = this.props;
        sendToNotebook({ value: commandText, language });
      })
      .catch(log.error);
  }

  sendToConsole() {
    const { sendToConsole } = this.props;
    this.getSelectedCommandText().then(sendToConsole).catch(log.error);
  }

  runInConsole() {
    this.getSelectedCommandText()
      .then(commandText => {
        const { sendToConsole } = this.props;
        sendToConsole(commandText, true, true);
      })
      .catch(log.error);
  }

  handleSelect(index) {
    const { sendToConsole } = this.props;
    const { items, offset } = this.state;
    if (index < offset || index >= offset + items.length) {
      log.error('Invalid index!', index);
      return;
    }

    const { name } = items[index - offset];
    sendToConsole(name);
  }

  handleSelectionChange(selectedRanges) {
    this.setState({ selectedRanges });
    this.updateActions();
  }

  handleViewportChange(top, bottom) {
    this.setState({ top, bottom });
  }

  handleSearchChange(e) {
    this.setState({ searchText: e.target.value });
  }

  handleViewportUpdate({ items, offset }) {
    const { table } = this.props;
    const itemCount = table.size;
    this.setState({ items, itemCount, offset });
  }

  renderItem({ item, itemIndex, isSelected }) {
    const { language, commandHistoryStorage } = this.props;
    return (
      <CommandHistoryItem
        itemIndex={itemIndex}
        isSelected={isSelected}
        item={item}
        language={language}
        commandHistoryStorage={commandHistoryStorage}
      />
    );
  }

  focus() {
    if (this.searchInputRef.current) {
      this.searchInputRef.current.focus();
    }
  }

  render() {
    const { language, table } = this.props;
    const {
      actions,
      historyActions,
      searchText,
      top,
      bottom,
      items,
      itemCount,
      offset,
      selectedRanges,
    } = this.state;
    const languageDisplayString = ConsoleConstants.LANGUAGE_MAP.get(language);
    return (
      <div className="command-history">
        <div className="command-history-search-bar">
          <SearchInput
            ref={this.searchInputRef}
            value={searchText}
            placeholder={`${languageDisplayString} Command History`}
            onChange={this.handleSearchChange}
          />
          <CommandHistoryActions
            actions={historyActions}
            hasSelection={selectedRanges.length > 0}
          />
        </div>
        <div className="command-history-list">
          <ItemList
            itemCount={itemCount}
            items={items}
            offset={offset}
            onSelect={this.handleSelect}
            onSelectionChange={this.handleSelectionChange}
            onViewportChange={this.handleViewportChange}
            renderItem={this.renderItem}
            rowHeight={CommandHistory.ITEM_HEIGHT}
            isDoubleClickSelect
            isMultiSelect
            isStickyBottom
          />
          <CommandHistoryViewportUpdater
            table={table}
            top={top}
            bottom={bottom}
            search={searchText}
            onUpdate={this.handleViewportUpdate}
          />
          <ContextActions actions={actions} />
        </div>
      </div>
    );
  }
}

CommandHistory.propTypes = {
  language: PropTypes.string.isRequired,
  sendToConsole: PropTypes.func.isRequired,
  sendToNotebook: PropTypes.func.isRequired,
  table: StoragePropTypes.CommandHistoryTable.isRequired,
  commandHistoryStorage: StoragePropTypes.CommandHistoryStorage,
};

CommandHistory.defaultProps = {
  commandHistoryStorage: {
    addItem() {
      log.error('commandHistoryStorage not provided');
    },
    updateItem() {
      log.error('commandHistoryStorage not provided');
    },
    getTable() {
      log.error('commandHistoryStorage not provided');
    },
  },
};

export default CommandHistory;
