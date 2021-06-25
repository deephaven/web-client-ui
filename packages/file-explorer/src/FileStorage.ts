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
  saveFile(file: File): Promise<File>;

  /**
   * Load the contents of a file
   * @param name The file to load, including the full path
   */
  loadFile(name: string): Promise<File>;

  /**
   * Delete a file
   * @param name The full name of the file to delete
   */
  deleteFile(name: string): Promise<void>;

  /**
   * Create the directory at the given path
   * @param name The full directory path
   */
  createDirectory(name: string): Promise<FileStorageItem>;
}

export default FileStorage;
