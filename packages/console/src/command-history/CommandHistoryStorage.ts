import {
  StorageTable,
  StorageItem,
  StorageItemListener,
  StorageListenerRemover,
  StorageErrorListener,
} from '@deephaven/storage';

export interface CommandHistoryStorageData {
  command: string;
  startTime: string;
  endTime?: string;
  result?: { error?: string };
}

export interface CommandHistoryStorageItem extends StorageItem {
  name: string;
  data: CommandHistoryStorageData;
}

export interface CommandHistoryTable
  extends StorageTable<CommandHistoryStorageItem> {
  setSearch(search: string): void;
}

export interface CommandHistoryStorage {
  /**
   * Retrieve a table filtered to the command history for the language and scope specified.
   * To achieve a separate history per scope (ie. dashboard), we add the scope as suffix to the data type.
   * When fetching the history, we then filter based on the timestamp
   * @param language The language to get the command history for
   * @param scope The scope of this command history, to keep different command histories separate
   * @param timestamp The time this command history scope was started
   */
  getTable(
    language: string,
    scope: string,
    timestamp: number
  ): Promise<CommandHistoryTable>;

  /**
   * Add a command to the command history
   * @param language The language to add the command history item for
   * @param scope The scope to add the command history for
   * @param command The command to add to the history
   * @param data The data to save with the command
   */
  addItem(
    language: string,
    scope: string,
    command: string,
    data: CommandHistoryStorageData
  ): Promise<CommandHistoryStorageItem>;

  /**
   * Save a modified CommandHistoryStorageItem
   * @param language The language of the item to save
   * @param item The modified item to save
   */
  updateItem(
    language: string,
    item: CommandHistoryStorageItem
  ): Promise<CommandHistoryStorageItem>;

  /**
   * Listen to an item with a specific id
   *
   * @param language The language of the item
   * @param id The id of the item to listen to
   * @param listener Called whenever there is an update on the item
   */
  listenItem(
    language: string,
    id: string,
    listener: StorageItemListener<CommandHistoryStorageItem>,
    onError?: StorageErrorListener
  ): StorageListenerRemover;
}

export default CommandHistoryStorage;
