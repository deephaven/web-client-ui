/* eslint-disable class-methods-use-this */
import Log from '@deephaven/log';
import {
  type CommandHistoryStorage,
  type CommandHistoryStorageData,
  type CommandHistoryStorageItem,
} from '@deephaven/console';
import {
  type StorageItemListener,
  type StorageListenerRemover,
} from '@deephaven/storage';
import PouchCommandHistoryTable from './PouchCommandHistoryTable';
import PouchCommandHistoryCache from './PouchCommandHistoryCache';

const log = Log.module('PouchCommandHistoryStorage');

export class PouchCommandHistoryStorage implements CommandHistoryStorage {
  private cache = new PouchCommandHistoryCache();

  private updateTableMap = new Map<string, PouchCommandHistoryTable>();

  private getUpdateTable(language: string): PouchCommandHistoryTable {
    if (!this.updateTableMap.has(language)) {
      this.updateTableMap.set(
        language,
        new PouchCommandHistoryTable(language, this.cache)
      );
    }

    return this.updateTableMap.get(language) as PouchCommandHistoryTable;
  }

  async getTable(language: string): Promise<PouchCommandHistoryTable> {
    return new PouchCommandHistoryTable(language, this.cache);
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
