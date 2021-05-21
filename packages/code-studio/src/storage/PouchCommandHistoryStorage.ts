/* eslint-disable class-methods-use-this */
import Log from '@deephaven/log';
import {
  CommandHistoryStorage,
  CommandHistoryStorageData,
  CommandHistoryStorageItem,
  CommandHistoryStorageTable,
  StorageItemListener,
  StorageListenerRemover,
} from '@deephaven/console';
import PouchStorageTable from './PouchStorageTable';

const log = Log.module('PouchCommandHistoryStorage');

function createTable(language: string): CommandHistoryStorageTable {
  return new PouchStorageTable<CommandHistoryStorageItem>(
    `CommandHistoryStorage.${language}`
  );
}
export class PouchCommandHistoryStorage implements CommandHistoryStorage {
  private updateTableMap = new Map<string, CommandHistoryStorageTable>();

  private getUpdateTable(language: string): CommandHistoryStorageTable {
    if (!this.updateTableMap.has(language)) {
      this.updateTableMap.set(language, createTable(language));
    }

    return this.updateTableMap.get(language) as CommandHistoryStorageTable;
  }

  async getTable(language: string): Promise<CommandHistoryStorageTable> {
    return createTable(language);
  }

  async addItem(
    language: string,
    scope: string,
    command: string,
    data: CommandHistoryStorageData
  ): Promise<CommandHistoryStorageItem> {
    return this.updateItem(language, {
      id: `${new Date().getTime()}`,
      name: command,
      data,
    } as CommandHistoryStorageItem);
  }

  async updateItem(
    language: string,
    item: CommandHistoryStorageItem
  ): Promise<CommandHistoryStorageItem> {
    const updateTable = this.getUpdateTable(language);

    const dbItem = await updateTable.refreshItem(item.id);

    const updatedItem = { ...(dbItem ?? {}), ...item };

    log.debug('Updating item', updatedItem);

    await updateTable.put(updatedItem);

    log.debug('Update saved');

    return item;
  }

  listenItem(
    language: string,
    id: string,
    listener: StorageItemListener<CommandHistoryStorageItem>
  ): StorageListenerRemover {
    const updateTable = this.getUpdateTable(language);

    return updateTable.onItemUpdate(id, listener);
  }
}

export default PouchCommandHistoryStorage;
