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
import { PromiseUtils } from '@deephaven/utils';
import PouchCommandHistoryCache from './PouchCommandHistoryCache';
import { siftPrunableItems } from './pouchCommandHistoryUtils';
import PouchStorageTable, {
  PouchDBSort,
  PouchStorageItem,
} from './PouchStorageTable';

const COMMAND_HISTORY_ITEMS_MAX = 2500;
const COMMAND_HISTORY_ITEMS_PRUNE = 2000;

const log = Log.module('PouchCommandHistoryTable');

type CommandHistoryDoc = PouchDB.Core.ExistingDocument<
  CommandHistoryStorageItem & PouchStorageItem & PouchDB.Core.AllDocsMeta
>;

export class PouchCommandHistoryTable
  extends PouchStorageTable<CommandHistoryStorageItem>
  implements CommandHistoryTable {
  constructor(language: string, private cache: PouchCommandHistoryCache) {
    super(`CommandHistoryStorage.${language}`, {
      // Optimizations to cut down on growing table size. These should be safe
      // since we don't care about revision history for command history
      // documents.
      auto_compaction: true,
      revs_limit: 1,
    });

    // Add this table instance to the table registry
    if (!this.cache.tableRegistry.has(this.cacheKey)) {
      this.cache.tableRegistry.set(this.cacheKey, new Set());
    }

    log.debug('Adding table to registry', this.cacheKey);
    this.cache.tableRegistry.get(this.cacheKey)?.add(this);
  }

  private searchText?: string;

  private get cacheKey(): string {
    return this.db.name;
  }

  setSearchDebounceTimeout?: number;

  setSearch(searchText: string): void {
    clearTimeout(this.setSearchDebounceTimeout);

    // Debounced search to minimize querying the PouchDB db while user types
    this.setSearchDebounceTimeout = window.setTimeout(() => {
      log.debug('Setting search filters', searchText);

      this.searchText = searchText.trim().toLowerCase();

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

  // Our current version of eslint + prettier doesn't always like the `override`
  // keyword. Whenever we upgrade, we should annotate this function with `override`.
  dbUpdate(
    event: PouchDB.Core.ChangesResponseChange<CommandHistoryStorageItem>
  ): void {
    log.debug('Clearing cache and refreshing data', event);

    this.cache.response.delete(this.cacheKey);

    super.dbUpdate(event);
  }

  /**
   * Fetch command history data from `this.cache.response` or from
   * PouchDB if data is not found in the cache. If the number of total items in
   * the db exceeds COMMAND_HISTORY_ITEMS_MAX, the database will be pruned down
   * to COMMAND_HISTORY_ITEMS_PRUNE total items. Note that PouchDB doesn't
   * actually remove them from the underlying IndexDB, they are just marked
   * as deleted and won't be present in our query results.
   * @param selector
   */
  private async fetchData(
    _selector: PouchDB.Find.Selector
  ): Promise<
    PouchDB.Find.FindResponse<CommandHistoryStorageItem & PouchStorageItem>
  > {
    // Wrapping this in a setTimeout so that it executes on next call stack.
    // This is necessary to ensure `this.cache` has been initialized due to some
    // nuances with property initilization with inherited classes.
    return PromiseUtils.withTimeout(0, async () => {
      if (this.cache.response.has(this.cacheKey)) {
        log.debug('Fetching from cache', this.searchText, this.viewport);
      } else {
        log.debug('Fetching from PouchDB', this.searchText, this.viewport);

        this.cache.response.set(
          this.cacheKey,
          this.db
            .allDocs({
              include_docs: true,
            })
            .then(result => {
              const allItems = result.rows
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                .map(row => row.doc!)
                .filter(({ name }) => name);

              log.debug(`Fetched ${allItems.length} command history items`);

              const { toKeep, toPrune } = siftPrunableItems(
                allItems,
                COMMAND_HISTORY_ITEMS_MAX,
                COMMAND_HISTORY_ITEMS_PRUNE
              );

              // If number of items in PouchDB has exceeded COMMAND_HISTORY_ITEMS_MAX
              // prune them down so we have COMMAND_HISTORY_ITEMS_PRUNE left
              if (toPrune.length) {
                this.pruneItems(toPrune);
              }

              return {
                docs: toKeep,
              };
            })
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const result = this.cache.response.get(this.cacheKey)!;

      if (this.searchText == null || this.searchText === '') {
        return result;
      }

      return {
        ...result,
        docs: (await result).docs.filter(({ name }) =>
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          name.toLowerCase().includes(this.searchText!)
        ),
      };
    });
  }

  /**
   * Override `PouchStorageTable.fetchInfo` so we can make use of
   * `PouchCommandHistoryCache`
   * @param selector
   */
  // Our current version of eslint + prettier doesn't always like the `override`
  // keyword. Whenever we upgrade, we should annotate this function with `override`.
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
  // Our current version of eslint + prettier doesn't always like the `override`
  // keyword. Whenever we upgrade, we should annotate this function with `override`.
  async fetchViewportData(
    viewport: StorageTableViewport,
    selector: PouchDB.Find.Selector,
    _sort: PouchDBSort
  ): Promise<ViewportData<CommandHistoryStorageItem>> {
    const data = await this.fetchData(selector);
    log.debug(
      'Fetching viewport data',
      viewport.top,
      viewport.bottom + 1,
      data
    );
    return {
      items: data.docs.slice(viewport.top, viewport.bottom + 1),
      offset: viewport.top,
    };
  }

  /**
   * Mark given items as `_deleted` in the database.
   * @param items
   */
  async pruneItems(items: CommandHistoryDoc[]) {
    if (this.cache.isPruning.has(this.cacheKey)) {
      log.debug('Pruning already in progress. Skipping.');
      return;
    }

    try {
      log.debug(`Pruning ${items.length} command history items`);

      // Disable change notifications while we bulk delete to avoid locking up
      // the app
      const resumeListeners = this.cache.pauseChangeListeners(this.cacheKey);

      this.cache.isPruning.set(this.cacheKey, true);
      await this.db.bulkDocs(items.map(item => ({ ...item, _deleted: true })));
      this.cache.isPruning.set(this.cacheKey, false);

      resumeListeners();

      log.debug('Finished pruning command history items');
    } catch (err) {
      log.error('An error occurred while pruning db', err);
    }
  }

  // Our current version of eslint + prettier doesn't always like the `override`
  // keyword. Whenever we upgrade, we should annotate this function with `override`.
  close(): void {
    log.debug(
      'Closing table',
      this,
      this.cache.tableRegistry.get(this.cacheKey)?.size
    );
    this.cache.tableRegistry.get(this.cacheKey)?.delete(this);
    this.changes?.cancel();
    super.close();
  }
}

export default PouchCommandHistoryTable;
