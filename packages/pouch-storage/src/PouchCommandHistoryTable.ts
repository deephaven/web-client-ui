import {
  CommandHistoryStorageItem,
  CommandHistoryTable,
} from '@deephaven/console';
import { Type as FilterType } from '@deephaven/filters';
import Log from '@deephaven/log';
import {
  StorageTableViewport,
  StorageUtils,
  ViewportData,
} from '@deephaven/storage';
import PouchStorageTable, {
  PouchDBSort,
  PouchStorageItem,
} from './PouchStorageTable';

const DISPLAY_COMMAND_HISTORY_LIMIT = 1000;

const log = Log.module('PouchCommandHistoryTable');

type CommandHistoryStorageItemFindRespose = PouchDB.Find.FindResponse<
  CommandHistoryStorageItem & PouchStorageItem
>;

export class PouchCommandHistoryTable
  extends PouchStorageTable<CommandHistoryStorageItem>
  implements CommandHistoryTable {
  constructor(language: string) {
    super(`CommandHistoryStorage.${language}`);
  }

  /**
   * Singleton cache for CommandHistoryStorageItem arrays keyed by databaseName.
   * This allows us to share results across multiple instances of
   * PouchCommandHistoryTable.
   */
  static cache: Record<
    string,
    Promise<CommandHistoryStorageItemFindRespose> | null
  > = {};

  private searchText = '';

  setSearchDebounceTimeout?: number;

  setSearch(searchText: string): void {
    clearTimeout(this.setSearchDebounceTimeout);

    // Debounced search to minimize querying the PouchDB db while user types
    this.setSearchDebounceTimeout = window.setTimeout(() => {
      log.debug('Clearing cache and setting search filters', searchText);
      log.debug('db.name', this.db.name);

      PouchCommandHistoryTable.cache[this.db.name] = null;

      this.searchText = searchText;
      this.setFilters(
        searchText
          ? [
              StorageUtils.makeFilterConfig([
                StorageUtils.makeFilterItem(
                  'name',
                  FilterType.contains,
                  searchText
                ),
              ]),
            ]
          : []
      );
    }, 500);
  }

  dbUpdate(
    event: PouchDB.Core.ChangesResponseChange<CommandHistoryStorageItem>
  ): void {
    log.debug('Clearing cache and refreshing data', event);

    PouchCommandHistoryTable.cache[this.db.name] = null;

    super.dbUpdate(event);
  }

  private async fetchData(
    selector: PouchDB.Find.Selector
  ): Promise<
    PouchDB.Find.FindResponse<CommandHistoryStorageItem & PouchStorageItem>
  > {
    if (PouchCommandHistoryTable.cache[this.db.name]) {
      log.debug('Fetching from cache', this.searchText, this.viewport);
    } else {
      log.debug('Fetching from PouchDB', this.searchText, this.viewport);

      if (this.searchText) {
        PouchCommandHistoryTable.cache[this.db.name] = this.db.find({
          selector,
          fields: ['id', 'name'],
          limit: DISPLAY_COMMAND_HISTORY_LIMIT,
          sort: [{ id: 'desc' }],
        });
      } else {
        PouchCommandHistoryTable.cache[this.db.name] = this.db
          .allDocs({
            include_docs: true,
            descending: true,
            limit: DISPLAY_COMMAND_HISTORY_LIMIT + 1, // +1 for an extra row returned by allDocs
          })
          .then(result => {
            result.rows.reverse();
            return {
              docs: result.rows
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                .map(row => row.doc!)
                .filter(({ name }) => name),
            };
          });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return PouchCommandHistoryTable.cache[this.db.name]!;
  }

  async fetchInfo(
    selector: PouchDB.Find.Selector
  ): Promise<
    PouchDB.Find.FindResponse<CommandHistoryStorageItem & PouchStorageItem>
  > {
    return this.fetchData(selector);
  }

  /**
   * Fetch command history storage items.
   * This override provides caching + optimizations specific to command history.
   *
   * 1. The table doesn't support sorting, so ignore the sort param.
   * 2. We cache the results to avoid excessive PouchDB queries during scrolling.
   * The cache should only need to be invalidated when search filter changes or
   * commands are added to the storage history.
   *
   * @param viewport
   * @param selector
   * @param _sort
   * @returns Promise to array of command history storage items
   */
  async fetchViewportData(
    viewport: StorageTableViewport,
    selector: PouchDB.Find.Selector,
    _sort: PouchDBSort
  ): Promise<ViewportData<CommandHistoryStorageItem>> {
    const data = await this.fetchData(selector);
    log.debug('data', data);
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      items: data.docs.slice(viewport.top, viewport.bottom + 1),
      offset: viewport.top,
    };
  }
}

export default PouchCommandHistoryTable;
