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
import PouchStorageTable, { PouchDBSort } from './PouchStorageTable';

const log = Log.module('PouchCommandHistoryTable');

export class PouchCommandHistoryTable
  extends PouchStorageTable<CommandHistoryStorageItem>
  implements CommandHistoryTable {
  constructor(language: string) {
    super(`CommandHistoryStorage.${language}`);
  }

  private cache: CommandHistoryStorageItem[] | null = null;

  setSearch(search: string): void {
    log.debug('Clearing cache and setting search filters', search);

    this.cache = null;

    this.setFilters(
      search
        ? [
            StorageUtils.makeFilterConfig([
              StorageUtils.makeFilterItem('name', FilterType.contains, search),
            ]),
          ]
        : []
    );
  }

  dbUpdate(
    event: PouchDB.Core.ChangesResponseChange<CommandHistoryStorageItem>
  ): void {
    log.debug('Clearing cache and refreshing data', event);

    this.cache = null;

    super.dbUpdate(event);
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
    if (this.cache) {
      log.debug('Fetching from cache', viewport, selector);
    } else {
      log.debug('Fetching from PouchDB', selector);

      this.cache = await this.db
        .find({
          selector,
          fields: ['id', 'name'],
        })
        .then(findResult => findResult.docs);
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      items: this.cache!.slice(viewport.top, viewport.bottom + 1),
      offset: viewport.top,
    };
  }
}

export default PouchCommandHistoryTable;
