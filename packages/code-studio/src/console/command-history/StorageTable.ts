export interface StorageTableViewport {
  // Keep it simple for Storage, just specify a top and bottom and a case insensitive search filter
  top: number;
  bottom: number;
  search: string;
}

export interface StorageTableViewportData<T extends StorageItem = StorageItem> {
  viewport: StorageTableViewport;
  items: T[];
}

export interface StorageItem {
  id: string;
  name: string;
}

export type StorageErrorListener = (error: string) => void;

export type StorageItemSuccessListener<T extends StorageItem = StorageItem> = (
  item: T
) => void;

export type StorageItemSuccessErrorListener<
  T extends StorageItem = StorageItem
> = {
  onUpdate?: StorageItemSuccessListener<T>;
  onError?: StorageErrorListener;
};

export type StorageItemListener<T extends StorageItem = StorageItem> =
  | StorageItemSuccessErrorListener<T>
  | StorageItemSuccessListener<T>;

export type StorageTableListener = () => void;

export type StorageListenerRemover = () => void;

export type StorageSnapshot<T> = Map<number, T>;

/**
 * A table for getting a list of items from storage, with id/name pairs
 * Can search the table with a case insensitive search
 * Just returns the id/name of the item
 */
export interface StorageTable<T extends StorageItem = StorageItem> {
  readonly viewport?: StorageTableViewport;
  readonly data?: StorageTableViewportData<T>;
  readonly size: number;

  refreshItem(id: string): Promise<T | undefined>;
  setReversed(reversed: boolean): void;
  setViewport(
    viewport: StorageTableViewport | undefined
  ): Promise<StorageTableViewportData<T> | undefined>;
  put(item: T): Promise<T>;
  onUpdate(listener: StorageTableListener): StorageListenerRemover;
  onItemUpdate(
    id: string,
    listener: StorageItemListener<T>
  ): StorageListenerRemover;
  getSnapshot(sortedRanges: [number, number][]): Promise<StorageSnapshot<T>>;
  close(): void;
}

export default StorageTable;
