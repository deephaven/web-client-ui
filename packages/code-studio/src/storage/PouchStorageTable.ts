import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import { FilterOperator, FilterType } from '@deephaven/iris-grid/dist/filters';
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
  StorageItemSuccessErrorListener,
  StorageItemSuccessListener,
  StorageSnapshot,
  ViewportData,
  ViewportUpdateCallback,
} from '@deephaven/storage';
import { CancelablePromise, PromiseUtils } from '@deephaven/utils';

const log = Log.module('PouchStorageTable');

const DB_PREFIX = 'Deephaven.';

PouchDB.plugin(PouchDBFind);

interface PouchStorageItem {
  _id?: string;
}

export type PouchDBSort = Array<
  string | { [propName: string]: 'asc' | 'desc' }
>;

function makePouchFilter(type: string, value: FilterValue | FilterValue[]) {
  switch (type) {
    case FilterType.in:
    case FilterType.contains:
      return { $regex: new RegExp(value) };
    case FilterType.inIgnoreCase:
      return { $regex: new RegExp(value, 'i') };
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

export class PouchStorageTable<T extends StorageItem = StorageItem>
  implements StorageTable<T> {
  private db: PouchDB.Database<T & PouchStorageItem>;

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

  constructor(databaseName: string) {
    this.db = new PouchDB<T & PouchStorageItem>(`${DB_PREFIX}${databaseName}`);

    this.db
      .changes({ live: true, since: 'now', include_docs: true })
      .on('change', this.dbUpdate.bind(this));

    this.db.createIndex({ index: { fields: ['id', 'name'] } });

    this.refreshInfo();
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
      ...(this.itemListeners.get(id) as StorageItemListener[]),
      listener,
    ]);

    this.refreshItem(id);

    return () => {
      this.itemListeners.set(
        id,
        (this.itemListeners.get(id) as StorageItemListener[]).filter(
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
    return this.viewportUpdatePromise;
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
        const listener = listeners[i];
        const successErrorListener = listener as StorageItemSuccessErrorListener<T>;
        const successListener = listener as StorageItemSuccessListener<T>;
        if (successErrorListener.onUpdate) {
          successErrorListener.onUpdate(item);
        } else {
          successListener(item);
        }
      }
    }
  }

  private dbUpdate(event: PouchDB.Core.ChangesResponseChange<T>): void {
    log.debug('Update received', event);

    this.refreshInfo();

    if (event.doc !== undefined) {
      this.sendItemUpdate(event.doc);
    }

    this.refreshData();
  }

  private async refreshInfo() {
    try {
      this.infoUpdatePromise?.cancel();

      this.infoUpdatePromise = PromiseUtils.makeCancelable(
        this.db.find({
          selector: selectorWithFilters(this.currentFilter ?? []),
          fields: [],
        })
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

  private async refreshData(): Promise<ViewportData<T> | undefined> {
    if (!this.currentViewport) {
      return;
    }

    try {
      const { currentViewport: viewport } = this;

      const sort: PouchDBSort = [{ id: this.currentReverse ? 'asc' : 'desc' }];

      this.viewportUpdatePromise?.cancel();

      this.viewportUpdatePromise = PromiseUtils.makeCancelable(
        this.db
          .find({
            selector: selectorWithFilters(this.currentFilter ?? []),
            skip: viewport.top,
            limit: viewport.bottom - viewport.top + 1,
            sort,
            fields: ['id', 'name'],
          })
          .then(findResult => ({
            items: findResult.docs,
            viewport,
          }))
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

    const sort: PouchDBSort = [{ id: this.currentReverse ? 'asc' : 'desc' }];

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
