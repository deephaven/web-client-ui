import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import {
  Operator as FilterOperator,
  Type as FilterType,
} from '@deephaven/filters';
import Log from '@deephaven/log';
import {
  FilterConfig,
  FilterValue,
  SortConfig,
  StorageItem,
  StorageTable,
  StorageListenerRemover,
  StorageTableViewport,
  StorageItemListener,
  StorageSnapshot,
  ViewportData,
  ViewportUpdateCallback,
} from '@deephaven/storage';
import { CancelablePromise, PromiseUtils } from '@deephaven/utils';

const log = Log.module('PouchStorageTable');

const DB_PREFIX = 'Deephaven.';

PouchDB.plugin(PouchDBFind);

export interface PouchStorageItem {
  _id?: string;
}

export type PouchDBSort = Array<
  string | { [propName: string]: 'asc' | 'desc' }
>;

function makePouchFilter(type: string, value: FilterValue | FilterValue[]) {
  switch (type) {
    case FilterType.in:
    case FilterType.contains:
      return { $regex: new RegExp(`${value}`) };
    case FilterType.inIgnoreCase:
      return { $regex: new RegExp(`${value}`, 'i') };
    case FilterType.eq:
      return { $eq: value };
    case FilterType.notEq:
      return { $neq: value };
    case FilterType.greaterThan:
      return { $gt: value };
    case FilterType.greaterThanOrEqualTo:
      return { $gte: value };
    case FilterType.lessThan:
      return { $lt: value };
    case FilterType.lessThanOrEqualTo:
      return { $lte: value };
    case FilterType.startsWith:
      return { $regex: new RegExp(`^(?${value}).*`) };
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}

function makePouchSelectorFromConfig(
  config: FilterConfig
): PouchDB.Find.Selector {
  const { filterItems, filterOperators } = config;
  let filter = null;
  for (let i = 0; i < filterItems.length; i += 1) {
    const filterItem = filterItems[i];
    const { columnName, type, value } = filterItem;
    const newFilter = { [columnName]: makePouchFilter(type, value) };
    if (i === 0) {
      filter = newFilter;
    } else if (filter !== null && i - 1 < filterOperators.length) {
      const filterOperator = filterOperators[i - 1];
      if (filterOperator === FilterOperator.and) {
        filter = { $and: [filter, newFilter] };
      } else if (filterOperator === FilterOperator.or) {
        filter = { $or: [filter, newFilter] };
      } else {
        throw new Error(
          `Unexpected filter operator ${filterOperator}, ${newFilter}`
        );
      }
    }
  }
  if (filter == null) {
    throw new Error(`Invalid filter config ${config}`);
  }
  return filter;
}

function selectorWithFilters(
  filters: FilterConfig[] = []
): PouchDB.Find.Selector {
  return {
    $and: [
      ...filters.map(filter => makePouchSelectorFromConfig(filter)),
      { name: { $gt: null } },
      { id: { $gt: null } },
    ],
  };
}

function sortWithConfigs(
  sorts: SortConfig[] | null,
  reverse = false
): PouchDBSort {
  return [
    { id: reverse ? 'desc' : 'asc' },
    ...(sorts?.map(sort => ({ [sort.column]: sort.direction })) ?? []),
  ];
}

export class PouchStorageTable<T extends StorageItem = StorageItem>
  implements StorageTable<T> {
  protected db: PouchDB.Database<T & PouchStorageItem>;

  changes?: PouchDB.Core.Changes<T & PouchStorageItem>;

  private listeners: ViewportUpdateCallback<T>[] = [];

  private itemListeners: Map<string, StorageItemListener<T>[]> = new Map();

  private currentSize = 0;

  private currentViewport?: StorageTableViewport;

  private currentReverse = false;

  private currentFilter: FilterConfig[] | null = null;

  private currentSort: SortConfig[] | null = null;

  private infoUpdatePromise?: CancelablePromise<
    PouchDB.Find.FindResponse<T & PouchStorageItem>
  >;

  private viewportUpdatePromise?: CancelablePromise<ViewportData<T>>;

  private currentViewportData?: ViewportData<T>;

  constructor(
    databaseName: string,
    dbOptions?: PouchDB.Configuration.DatabaseConfiguration
  ) {
    this.db = new PouchDB<T & PouchStorageItem>(
      `${DB_PREFIX}${databaseName}`,
      dbOptions
    );

    // Need to set `_remote` to false to remove deprecation warnings: https://github.com/pouchdb/pouchdb/issues/6106
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
    (this.db as any)._remote = false;

    this.listenForChanges();

    this.db.createIndex({ index: { fields: ['id', 'name'] } });

    this.refreshInfo();
  }

  /**
   * Listen for db changes. This can be cancelled by calling
   * `this.changes?.cancel()`
   */
  listenForChanges(): void {
    this.changes = this.db
      .changes({ live: true, since: 'now', include_docs: true })
      .on('change', this.dbUpdate.bind(this));
  }

  onUpdate(callback: ViewportUpdateCallback<T>): StorageListenerRemover {
    this.listeners = [...this.listeners, callback];
    return () => {
      this.listeners = this.listeners.filter(other => other !== callback);
    };
  }

  onItemUpdate(
    id: string,
    listener: StorageItemListener<T>
  ): StorageListenerRemover {
    if (!this.itemListeners.has(id)) {
      this.itemListeners.set(id, []);
    }

    this.itemListeners.set(id, [
      ...(this.itemListeners.get(id) as StorageItemListener<T>[]),
      listener,
    ]);

    this.refreshItem(id);

    return () => {
      this.itemListeners.set(
        id,
        (this.itemListeners.get(id) as StorageItemListener<T>[]).filter(
          other => other !== listener
        )
      );
    };
  }

  close(): void {
    this.listeners = [];
  }

  get size(): number {
    return this.currentSize;
  }

  get viewport(): StorageTableViewport | undefined {
    return this.currentViewport;
  }

  setReversed(reversed: boolean): void {
    this.currentReverse = reversed;

    this.currentViewportData = undefined;

    this.refreshData();
  }

  setViewport(viewport: StorageTableViewport | undefined): void {
    this.currentViewport = viewport;

    this.refreshInfo();

    this.refreshData();
  }

  setSorts(config: SortConfig[] | null): void {
    this.currentSort = config;

    this.currentViewportData = undefined;

    this.refreshData();
  }

  setFilters(config: FilterConfig[] | null): void {
    this.currentFilter = config;

    this.currentViewportData = undefined;

    this.refreshInfo();

    this.refreshData();
  }

  get data(): ViewportData<T> | undefined {
    return this.currentViewportData;
  }

  async getViewportData(): Promise<ViewportData<T>> {
    if (!this.viewportUpdatePromise) {
      this.refreshData();
    }
    return (
      this.viewportUpdatePromise ?? Promise.resolve({ items: [], offset: 0 })
    );
  }

  async put(item: T): Promise<T> {
    // Put the item ID in both the _id and the id slot
    // PouchDB uses _id everywhere, StorageTable just uses `id` though
    const newItem = {
      ...item,
      _id: item.id,
    } as T;

    await this.db.put(newItem);

    return newItem;
  }

  private sendUpdate() {
    // Retain a reference to it in case a listener gets removed while sending an update
    const { listeners } = this;
    const data = this.currentViewportData ?? { items: [], offset: 0 };
    for (let i = 0; i < listeners.length; i += 1) {
      listeners[i](data);
    }
  }

  private sendItemUpdate(item: T) {
    const listeners = this.itemListeners.get(item.id);
    if (listeners !== undefined) {
      for (let i = 0; i < listeners.length; i += 1) {
        listeners[i](item);
      }
    }
  }

  protected dbUpdate(event: PouchDB.Core.ChangesResponseChange<T>): void {
    log.debug('Update received', event);

    this.refreshInfo();

    if (event.doc !== undefined) {
      this.sendItemUpdate(event.doc);
    }

    this.refreshData();
  }

  /**
   * Fetch infor for a given selector.
   * @param selector
   */
  protected async fetchInfo(
    selector: PouchDB.Find.Selector
  ): Promise<PouchDB.Find.FindResponse<T & PouchStorageItem>> {
    return this.db.find({
      selector,
      fields: [],
    });
  }

  private async refreshInfo() {
    try {
      this.infoUpdatePromise?.cancel();

      this.infoUpdatePromise = PromiseUtils.makeCancelable(
        this.fetchInfo(selectorWithFilters(this.currentFilter ?? []))
      );

      const findResult = await this.infoUpdatePromise;

      this.currentSize = findResult.docs.length;

      this.sendUpdate();
    } catch (e) {
      if (!PromiseUtils.isCanceled(e)) {
        log.error('Unable to refreshInfo', e);
        throw e;
      }
    }
  }

  /**
   * Fetch data for the given viewport, selector, and sort.
   * @param viewport
   * @param selector
   * @param sort
   */
  protected async fetchViewportData(
    viewport: StorageTableViewport,
    selector: PouchDB.Find.Selector,
    sort: PouchDBSort
  ): Promise<ViewportData<T>> {
    return this.db
      .find({
        selector,
        skip: viewport.top,
        limit: viewport.bottom - viewport.top + 1,
        sort,
        fields: ['id', 'name'],
      })
      .then(findResult => ({
        items: findResult.docs,
        offset: viewport.top,
      }));
  }

  private async refreshData(): Promise<ViewportData<T> | undefined> {
    if (!this.currentViewport) {
      return;
    }

    try {
      const selector = selectorWithFilters(this.currentFilter ?? []);
      const sort = sortWithConfigs(this.currentSort, this.currentReverse);

      this.viewportUpdatePromise?.cancel();

      this.viewportUpdatePromise = PromiseUtils.makeCancelable(
        this.fetchViewportData(this.currentViewport, selector, sort)
      );

      const viewportData = await this.viewportUpdatePromise;

      this.currentViewportData = viewportData;

      this.sendUpdate();

      return viewportData;
    } catch (e) {
      if (!PromiseUtils.isCanceled(e)) {
        log.error('Unable to refreshData', e);
        throw e;
      }
    }
  }

  async refreshItem(id: string): Promise<T | undefined> {
    const findResult = await this.db.find({
      selector: { id },
      limit: 1,
    });

    const item = findResult.docs[0];

    if (item !== undefined) {
      this.sendItemUpdate(item);
    }

    return item;
  }

  async getSnapshot(
    sortedRanges: [number, number][]
  ): Promise<StorageSnapshot<T>> {
    const itemMap = new Map();

    const sort: PouchDBSort = [{ id: this.currentReverse ? 'desc' : 'asc' }];

    await Promise.all(
      sortedRanges.map(async ([from, to]) => {
        const limit = to - from + 1;
        return this.db
          .find({
            selector: selectorWithFilters(this.currentFilter ?? []),
            skip: from,
            limit,
            sort,
            fields: ['id', 'name'],
          })
          .then(findSnapshotResult => {
            for (let i = 0; i < limit; i += 1) {
              const index = from + i;
              itemMap.set(index, findSnapshotResult.docs[i]);
            }
          });
      })
    );

    return itemMap;
  }
}

export default PouchStorageTable;
