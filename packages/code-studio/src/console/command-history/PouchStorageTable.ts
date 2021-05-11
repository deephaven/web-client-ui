import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import Log from '@deephaven/log';
import {
  StorageItem,
  StorageTable,
  StorageListenerRemover,
  StorageTableViewport,
  StorageTableViewportData,
  StorageItemListener,
  StorageTableListener,
  StorageItemSuccessErrorListener,
  StorageItemSuccessListener,
  StorageSnapshot,
} from './StorageTable';

const log = Log.module('PouchStorageTable');

const DB_PREFIX = 'Deephaven.';

PouchDB.plugin(PouchDBFind);

interface PouchStorageItem {
  _id?: string;
}

export type PouchDBSort = Array<
  string | { [propName: string]: 'asc' | 'desc' }
>;

function selectorWithSearch(search = ''): PouchDB.Find.Selector {
  return {
    $and: [
      { name: { $regex: new RegExp(search, 'i') } },
      { name: { $gt: null } },
      // Filter out all IDs starting with _, these are used by PouchDB for indexes
      { id: { $regex: new RegExp('^(?!_).*') } },
      { id: { $gt: null } },
    ],
  };
}

export class PouchStorageTable<T extends StorageItem = StorageItem>
  implements StorageTable<T> {
  private db: PouchDB.Database<T & PouchStorageItem>;

  private listeners: StorageTableListener[] = [];

  private itemListeners: Map<string, StorageItemListener<T>[]> = new Map();

  private currentSize = 0;

  private currentViewport?: StorageTableViewport;

  private currentViewportData?: StorageTableViewportData<T>;

  private sort: PouchDBSort;

  constructor(databaseName: string, sort: PouchDBSort = [{ id: 'asc' }]) {
    this.db = new PouchDB<T & PouchStorageItem>(`${DB_PREFIX}${databaseName}`);

    this.db
      .changes({ live: true, since: 'now', include_docs: true })
      .on('change', this.dbUpdate.bind(this));

    this.db.createIndex({ index: { fields: ['id', 'name'] } });

    this.sort = sort;

    this.refreshInfo();
  }

  setReversed(reversed: boolean): void {
    this.sort = [{ id: reversed ? 'desc' : 'asc' }];
    this.refreshData();
  }

  onUpdate(listener: StorageListenerRemover): StorageListenerRemover {
    this.listeners = [...this.listeners, listener];
    return () => {
      this.listeners = this.listeners.filter(other => other !== listener);
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

  async setViewport(
    viewport: StorageTableViewport | undefined
  ): Promise<StorageTableViewportData<T> | undefined> {
    if (this.currentViewport?.search !== viewport?.search) {
      this.currentViewportData = undefined;
    }

    this.currentViewport = viewport;

    this.refreshInfo();

    return this.refreshData();
  }

  get data(): StorageTableViewportData<T> | undefined {
    return this.currentViewportData;
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
    for (let i = 0; i < listeners.length; i += 1) {
      listeners[i]();
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
    const currentSearch = this.currentViewport?.search;

    const findResult = await this.db.find({
      selector: selectorWithSearch(currentSearch),
      fields: [],
    });

    if (this.currentViewport?.search !== currentSearch) {
      log.debug2(
        'refreshInfo ignoring update, changed before response received'
      );
    }

    this.currentSize = findResult.docs.length;

    this.sendUpdate();
  }

  private async refreshData(): Promise<
    StorageTableViewportData<T> | undefined
  > {
    if (!this.currentViewport) {
      return;
    }

    const { currentViewport: viewport } = this;

    const findResult = await this.db.find({
      selector: selectorWithSearch(viewport.search),
      skip: viewport.top,
      limit: viewport.bottom - viewport.top + 1,
      sort: this.sort,
      fields: ['id', 'name'],
    });

    const viewportData = {
      viewport,
      items: findResult.docs,
    };

    if (this.currentViewport !== viewport) {
      log.debug2('Viewport changed before update received');
      return viewportData;
    }

    this.currentViewportData = viewportData;

    this.sendUpdate();

    return viewportData;
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
    if (!this.currentViewport) {
      throw new Error('Viewport not set');
    }
    const { currentViewport: viewport } = this;

    const itemMap: Map<number, T> = new Map();
    const indexes: number[] = [];
    let lastIndex = -1;

    await Promise.all(
      sortedRanges.map(async ([from, to]) => {
        const limit = to - from + 1;
        return this.db
          .find({
            selector: selectorWithSearch(viewport.search),
            skip: from,
            limit,
            sort: this.sort,
            fields: ['id', 'name'],
          })
          .then(findSnapshotResult => {
            for (let i = 0; i < limit; i += 1) {
              const index = from + i;
              indexes.push(index);
              itemMap.set(index, findSnapshotResult.docs[i]);
            }
          });
      })
    );

    function iterator() {
      return {
        hasNext: () => lastIndex + 1 < indexes.length,
        next: () => {
          lastIndex += 1;
          return {
            value: indexes[lastIndex],
            done: lastIndex >= indexes.length,
          };
        },
      };
    }

    return {
      added: { [Symbol.iterator]: iterator },
      get: (index: number) => itemMap.get(index),
    };
  }
}

export default PouchStorageTable;
