import { StorageTable, StorageItem } from '@deephaven/storage';

export interface FileStorageItem extends StorageItem, FileMetadata {
  type: 'file' | 'directory';
}

/**
 * Basic metadata of the file
 */
export interface FileMetadata {
  /** Full path of the file */
  name: string;
}

/**
 * A file including it's contents
 */
export interface File extends FileMetadata {
  content: string;
}

/**
 * A draft file may not have an id until it is saved
 */
export interface DraftFile extends File {
  id?: string;
}

/**
 * A loaded file must always have an id
 */
export interface LoadedFile extends File {
  id: string;
}

export interface FileStorageTable extends StorageTable<FileStorageItem> {
  setSearch(search: string): void;
}

/**
 * FileStorage abstraction. Has methods for managing files, and for retrieving a table to browse files.
 */
export interface FileStorage {
  /**
   * Retrieve a table to view the file list
   */
  getTable(): Promise<FileStorageTable>;

  /**
   * Save a file
   * @param file The file to save
   */
  saveFile(file: DraftFile): Promise<LoadedFile>;

  /**
   * Load the contents of a file
   * @param id The file to load
   */
  loadFile(id: string): Promise<LoadedFile>;

  /**
   * Delete a file
   * @param id The file id to delete
   */
  deleteFile(id: string): Promise<void>;
}

export default FileStorage;
