import {
  FileStorageItem,
  FileStorageTable,
  isDirectory,
} from '@deephaven/file-explorer';
import {
  ViewportData,
  IndexRange,
  StorageSnapshot,
  StorageTableViewport,
  FilterConfig,
  SortConfig,
  ViewportUpdateCallback,
  StorageListenerRemover,
} from '@deephaven/storage';

export class MockFileStorageTable implements FileStorageTable {
  private items: FileStorageItem[];

  private onUpdateCallback?: ViewportUpdateCallback<FileStorageItem>;

  constructor(items: FileStorageItem[]) {
    this.items = items;
  }

  /* eslint-disable class-methods-use-this */
  setSearch(search: string): void {
    // no-op
  }

  setExpanded(path: string, expanded: boolean): Promise<void> {
    // only sets expansion for the FileExplorer in NewItemModal
    if (path.charAt(path.length - 1) === '/') {
      for (let i = 0; i < this.items.length; i += 1) {
        const item = this.items[i];
        if (
          isDirectory(item) &&
          (`${item.filename}/` === path || item.filename === path)
        ) {
          item.isExpanded = expanded;
        }
      }
    }
    return Promise.resolve();
  }

  collapseAll(): Promise<void> {
    for (let i = 0; i < this.items.length; i += 1) {
      const item = this.items[i];
      if (isDirectory(item)) {
        item.isExpanded = false;
      }
    }
    return Promise.resolve();
  }

  getViewportData(): Promise<ViewportData<FileStorageItem>> {
    return Promise.resolve({
      items: this.items, // Fill in with mock items
      offset: 0,
    });
  }

  async getSnapshot(
    sortedRanges: IndexRange[]
  ): Promise<StorageSnapshot<FileStorageItem>> {
    throw new Error('Method not implemented.');
  }

  async setViewport(viewport: StorageTableViewport): Promise<void> {
    const loadedViewportData = await this.getViewportData();
    this.onUpdateCallback?.(loadedViewportData);
  }

  setFilters(config: FilterConfig[] | null): void {
    // no-op
  }

  setSorts(config: SortConfig[] | null): void {
    // no-op
  }

  setReversed(isReversed: boolean): void {
    // no-op
  }

  close(): void {
    // no-op
  }

  onUpdate(
    callback: ViewportUpdateCallback<FileStorageItem>
  ): StorageListenerRemover {
    this.onUpdateCallback = callback;
    return jest.fn();
  }

  get size(): number {
    return this.items.length;
  }
}

export default MockFileStorageTable;
