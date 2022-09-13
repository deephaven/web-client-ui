import { File, FileStorage, FileStorageItem, FileStorageTable } from '@deephaven/file-explorer';
import MockFileStorageTable from './MockFileStorageTable';

export class MockFileStorage implements FileStorage {
  private items: FileStorageItem[];
  
  constructor(items: FileStorageItem[]) {
    this.items = items;
  }

  async getTable(): Promise<FileStorageTable> {
    return new MockFileStorageTable(this.items);
  }
  saveFile(file: File): Promise<File> {
    throw new Error('Method not implemented.');
  }
  loadFile(name: string): Promise<File> {
    throw new Error('Method not implemented.');
  }
  deleteFile(name: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  moveFile(name: string, newName: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  info(name: string): Promise<FileStorageItem> {
    throw new Error('Method not implemented.');
  }
  createDirectory(name: string): Promise<FileStorageItem> {
    throw new Error('Method not implemented.');
  }
}

export default MockFileStorage;