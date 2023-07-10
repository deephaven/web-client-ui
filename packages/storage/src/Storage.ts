export type FilterValue = number | string | string[];

export type FilterConfigItem = {
  columnName: string;
  type: string;
  value: FilterValue;
};

export type FilterConfig = {
  filterItems: FilterConfigItem[];
  filterOperators: string[];
};

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export type SortConfig = {
  column: string;
  direction: SortDirection;
};

export type IndexRange = number[];

export interface Storage<T extends StorageItem> {
  getTable(): Promise<StorageTable<T>>;
  close(): void;
}

export interface StorageTable<T extends StorageItem> {
  getViewportData(): Promise<ViewportData<T>>;
  getSnapshot(sortedRanges: IndexRange[]): Promise<StorageSnapshot<T>>;
  setViewport(viewport: StorageTableViewport): void;
  setFilters(config: FilterConfig[] | null): void;
  setSorts(config: SortConfig[] | null): void;
  setReversed(isReversed: boolean): void;
  close(): void;
  onUpdate(callback: ViewportUpdateCallback<T>): StorageListenerRemover;
  size: number;
}

export interface StorageItem {
  id: string;
}

export interface UnsavedStorageItem {
  id: undefined;
}

export type StorageTableViewport = {
  top: number;
  bottom: number;
  columns?: string[];
};

export type StorageSnapshot<T extends StorageItem> = Map<number, T>;

export type ViewportData<T extends StorageItem> = {
  items: T[];
  offset: number;
};

export type ViewportUpdateCallback<T extends StorageItem> = (
  viewportUpdate: ViewportData<T>
) => void;

export type StorageListenerRemover = () => void;

export type StorageItemListener<T extends StorageItem> = (update: T) => void;

export type StorageErrorListener = (error: string) => void;
