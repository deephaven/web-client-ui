import { FileStat, WebDAVClient } from 'webdav/web';
import Log from '@deephaven/log';
import {
  StorageTableViewport,
  StorageListenerRemover,
  ViewportUpdateCallback,
  ViewportData,
  IndexRange,
  StorageSnapshot,
} from '@deephaven/storage';
import { CancelablePromise, PromiseUtils } from '@deephaven/utils';
import { FileStorageTable, FileStorageItem } from './FileStorage';

const log = Log.module('WebdavFileStorageTable');

/**
 * Implementation of FileStorageTable for WebDAV.
 * Takes a path to specify what root this table should start at.
 */
export class WebdavFileStorageTable implements FileStorageTable {
  readonly client: WebDAVClient;

  readonly root: string;

  private currentSize = 0;

  private currentViewport?: StorageTableViewport;

  private listeners: ViewportUpdateCallback<FileStorageItem>[] = [];

  private viewportUpdatePromise?: CancelablePromise<
    ViewportData<FileStorageItem>
  >;

  private currentViewportData?: ViewportData<FileStorageItem>;

  /**
   * Map of expanded directory paths to the tables that manage that path.
   * We use a tree of tables to query the server so we just get the directories that are expanded.
   * Also the nginx module we are using does not support a depth of infinity: https://github.com/arut/nginx-dav-ext-module/blob/f5e30888a256136d9c550bf1ada77d6ea78a48af/ngx_http_dav_ext_module.c#L757
   */
  private childTables: Map<string, WebdavFileStorageTable> = new Map();

  /**
   * @param client The WebDAV client instance to use
   * @param root The root path for this storage table
   */
  constructor(client: WebDAVClient, root = '/') {
    this.client = client;
    this.root = root;
  }

  getViewportData(): Promise<ViewportData<FileStorageItem>> {
    if (!this.viewportUpdatePromise) {
      this.refreshInternal();
    }
    return (
      this.viewportUpdatePromise ?? Promise.resolve({ items: [], offset: 0 })
    );
  }

  // eslint-disable-next-line class-methods-use-this
  getSnapshot(
    sortedRanges: IndexRange[]
  ): Promise<StorageSnapshot<FileStorageItem>> {
    throw new Error('Method not implemented.');
  }

  get size(): number {
    return this.currentSize;
  }

  async setExpanded(path: string, expanded: boolean): Promise<void> {
    const paths = path.split('/');
    let nextPath = paths.shift();
    if (!nextPath) {
      nextPath = paths.shift();
    }
    if (!nextPath) {
      throw new Error(`Invalid path: ${path}`);
    }
    const remainingPath = paths.join('/');
    if (expanded) {
      if (!this.childTables.has(nextPath)) {
        const childTable = new WebdavFileStorageTable(
          this.client,
          `${this.root}${nextPath}/`
        );
        this.childTables.set(nextPath, childTable);
      }
      if (remainingPath) {
        const childTable = this.childTables.get(nextPath);
        childTable?.setExpanded(remainingPath, expanded);
      }
    } else if (this.childTables.has(nextPath)) {
      if (remainingPath) {
        const childTable = this.childTables.get(nextPath);
        childTable?.setExpanded(remainingPath, expanded);
      } else {
        this.childTables.delete(nextPath);
      }
    }
    if (this.currentViewport) {
      await this.refreshInternal();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  setSearch(search: string): void {
    throw new Error('Method not implemented.');
  }

  setViewport(viewport: StorageTableViewport): void {
    this.currentViewport = viewport;

    this.refreshInternal();
  }

  // eslint-disable-next-line class-methods-use-this
  setFilters(): void {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line class-methods-use-this
  setSorts(): void {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line class-methods-use-this
  setReversed(): void {
    throw new Error('Method not implemented.');
  }

  close(): void {
    this.listeners = [];
  }

  onUpdate(
    callback: ViewportUpdateCallback<FileStorageItem>
  ): StorageListenerRemover {
    this.listeners = [...this.listeners, callback];
    return () => {
      this.listeners = this.listeners.filter(other => other !== callback);
    };
  }

  async refresh(): Promise<ViewportData<FileStorageItem>> {
    log.debug2(this.root, 'refreshData');

    this.viewportUpdatePromise?.cancel();

    this.viewportUpdatePromise = PromiseUtils.makeCancelable(this.fetchData());

    const viewportData = await this.viewportUpdatePromise;

    this.currentViewportData = viewportData;

    this.sendUpdate();

    return viewportData;
  }

  /**
   * Refreshes data, but catches any errors and logs them
   */
  private async refreshInternal(): Promise<void> {
    try {
      await this.refresh();
    } catch (e) {
      if (!PromiseUtils.isCanceled(e)) {
        log.error('Unable to refresh data', e);
      }
    }
  }

  private async fetchData(): Promise<ViewportData<FileStorageItem>> {
    const { currentViewport: viewport } = this;
    if (!viewport) {
      throw new Error('No viewport set');
    }

    // First get the root directory contents
    let items = await this.client.getDirectoryContents(this.root).then(
      dirContents =>
        (dirContents as FileStat[])
          .map(file => ({
            ...file,
            id: file.filename,
            isExpanded:
              file.type === 'directory'
                ? this.childTables.has(file.basename)
                : undefined,
          }))
          .sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'directory' ? -1 : 1;
            }
            return a.basename.localeCompare(b.basename);
          }) as FileStorageItem[]
    );

    // Get the data from all expanded directories
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const { basename, filename } = item;
      if (filename === `${this.root}${basename}` && item.type === 'directory') {
        const childTable = this.childTables.get(basename);
        if (childTable != null) {
          childTable.setViewport({ top: 0, bottom: viewport.bottom - i });
          // eslint-disable-next-line no-await-in-loop
          const childViewportData = await childTable.getViewportData();
          items.splice(i + 1, 0, ...childViewportData.items);
        }
      }
    }

    this.currentSize = items.length;

    log.debug2(this.root, 'items', items, viewport);

    // Slice it to the correct viewport
    items = items.slice(viewport.top, viewport.bottom);

    return { items, offset: viewport.top };
  }

  private sendUpdate() {
    // Retain a reference to it in case a listener gets removed while sending an update
    const { listeners } = this;
    const data = this.currentViewportData ?? { items: [], offset: 0 };
    for (let i = 0; i < listeners.length; i += 1) {
      listeners[i](data);
    }
  }
}

export default WebdavFileStorageTable;
