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

// Max number of history items that will be loaded
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
   * Cache for command history query results keyed by db name. The cached data
   * will be shared across all `PouchCommandHistoryTable` instances that have
   * the same db name.
   */
  static cache: Record<
    string,
    Promise<CommandHistoryStorageItemFindRespose> | null
  > = {};

  private searchText = '';

  private get cacheKey(): string {
    return this.db.name;
  }

  setSearchDebounceTimeout?: number;

  setSearch(searchText: string): void {
    clearTimeout(this.setSearchDebounceTimeout);

    // Debounced search to minimize querying the PouchDB db while user types
    this.setSearchDebounceTimeout = window.setTimeout(() => {
      log.debug('Clearing cache and setting search filters', searchText);
      log.debug('db.name', this.db.name);

      PouchCommandHistoryTable.cache[this.cacheKey] = null;

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

    PouchCommandHistoryTable.cache[this.cacheKey] = null;

    super.dbUpdate(event);
  }

  /**
   * Fetch command history data from `PouchCommandHistoryTable.cache` or from
   * PouchDB if data is not found in the cache.
   * @param selector
   */
  private async fetchData(
    selector: PouchDB.Find.Selector
  ): Promise<
    PouchDB.Find.FindResponse<CommandHistoryStorageItem & PouchStorageItem>
  > {
    if (PouchCommandHistoryTable.cache[this.cacheKey]) {
      log.debug('Fetching from cache', this.searchText, this.viewport);
    } else {
      log.debug('Fetching from PouchDB', this.searchText, this.viewport);

      // PouchDB `find` queries require scanning the entire table which can have
      // a significant performance impact on large tables. Therefore we only
      // call db.find when there is a search applied. Otherwise we use the faster
      // `allDocs` method. We also apply an optimzation by reverse sorting the
      // query and then reversing back the results.
      const queryResult = this.searchText
        ? this.db.find({
            selector,
            fields: ['id', 'name'],
            limit: DISPLAY_COMMAND_HISTORY_LIMIT,
            sort: [{ id: 'desc' }],
          })
        : this.db
            .allDocs({
              include_docs: true,
              descending: true,
              // There is an extra row returned by `allDocs` that is not part of
              // the command history. We add 1 to the limit to account for it but
              // filter it out of the result set below.
              limit: DISPLAY_COMMAND_HISTORY_LIMIT + 1,
            })
            .then(result => ({
              docs: result.rows
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                .map(row => row.doc!)
                .filter(({ name }) => name),
            }));

      // reverse the doc order and cache the query results.
      PouchCommandHistoryTable.cache[this.cacheKey] = queryResult.then(
        result => {
          result.docs.reverse();
          return result;
        }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return PouchCommandHistoryTable.cache[this.cacheKey]!;
  }

  /**
   * Override `PouchStorageTable.fetchInfo` so we can make use of
   * `PouchCommandHistoryTable.cache`
   * @param selector
   */
  async fetchInfo(
    selector: PouchDB.Find.Selector
  ): Promise<
    PouchDB.Find.FindResponse<CommandHistoryStorageItem & PouchStorageItem>
  > {
    return this.fetchData(selector);
  }

  /**
   * Override `PouchStorageTable.fetchViewportData` to fetch command history
   * storage items. This override provides caching + optimizations specific to
   * command history.
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
    log.debug('fetchViewportData', data);
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      items: data.docs.slice(viewport.top, viewport.bottom + 1),
      offset: viewport.top,
    };
  }
}

export default PouchCommandHistoryTable;
