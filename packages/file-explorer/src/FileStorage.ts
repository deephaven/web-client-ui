import { StorageTable, StorageItem } from '@deephaven/storage';

/**
 * Basic metadata of the file
 */
export interface FileMetadata {
  /** Full path of the file */
  filename: string;

  /** Just the file name part of the file (no path) */
  basename: string;
}

export type FileType = 'file' | 'directory';

export interface FileStorageItem extends StorageItem, FileMetadata {
  type: FileType;
}

export interface DirectoryStorageItem extends FileStorageItem {
  type: 'directory';
  isExpanded: boolean;
}

export function isDirectory(
  file: FileStorageItem
): file is DirectoryStorageItem {
  return file.type === 'directory';
}

/**
 * A file including it's contents
 */
export interface File extends FileMetadata {
  content: string;
}

export interface FileStorageTable extends StorageTable<FileStorageItem> {
  setSearch(search: string): void;

  /**
   * @param path The path to expand
   * @param expanded What expanded state to set
   */
  setExpanded(path: string, expanded: boolean): Promise<void>;
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
   * Move a file to a new location
   * @param name Source file name
   * @param newName The new file name, including path
   */
  moveFile(name: string, newName: string): Promise<void>;

  /**
   * Create the directory at the given path
   * @param name The full directory path
   */
  createDirectory(name: string): Promise<FileStorageItem>;
}

export default FileStorage;
