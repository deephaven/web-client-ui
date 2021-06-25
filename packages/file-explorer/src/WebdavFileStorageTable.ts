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

const log = Log.module('PouchStorageTable');

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
   * @param client The WebDAV client instance to use
   * @param root The root path for this storage table
   */
  constructor(client: WebDAVClient, root = '/') {
    this.client = client;
    this.root = root;
  }

  getViewportData(): Promise<ViewportData<FileStorageItem>> {
    if (!this.viewportUpdatePromise) {
      this.refreshData();
    }
    return (
      this.viewportUpdatePromise ?? Promise.resolve({ items: [], offset: 0 })
    );
  }

  getSnapshot(
    sortedRanges: IndexRange[]
  ): Promise<StorageSnapshot<FileStorageItem>> {
    throw new Error('Method not implemented.');
  }

  get size(): number {
    return this.currentSize;
  }

  // eslint-disable-next-line class-methods-use-this
  setSearch(search: string): void {
    throw new Error('Method not implemented.');
  }

  setViewport(viewport: StorageTableViewport): void {
    this.currentViewport = viewport;

    this.refreshData();
  }

  setFilters(): void {
    throw new Error('Method not implemented.');
  }

  setSorts(): void {
    throw new Error('Method not implemented.');
  }

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

  async refreshData(): Promise<ViewportData<FileStorageItem> | undefined> {
    if (!this.currentViewport) {
      return;
    }

    try {
      const { currentViewport: viewport } = this;

      this.viewportUpdatePromise?.cancel();

      this.viewportUpdatePromise = PromiseUtils.makeCancelable(
        this.client.getDirectoryContents(this.root).then(dirContents => ({
          items: (dirContents as FileStat[])
            .map(file => ({
              ...file,
              id: file.filename,
              name: file.basename,
            }))
            .sort((a, b) => a.filename.localeCompare(b.filename)),
          offset: viewport.top,
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
