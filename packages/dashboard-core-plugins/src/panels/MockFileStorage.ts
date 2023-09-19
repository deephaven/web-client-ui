import {
  File,
  FileNotFoundError,
  FileStorage,
  FileStorageItem,
  FileStorageTable,
  FileUtils,
} from '@deephaven/file-explorer';
import MockFileStorageTable from './MockFileStorageTable';

export class MockFileStorage implements FileStorage {
  private items: FileStorageItem[];

  constructor(items: FileStorageItem[]) {
    this.items = items;
  }

  async getTable(): Promise<FileStorageTable> {
    return new MockFileStorageTable(this.items);
  }

  /* eslint-disable class-methods-use-this */
  saveFile(file: File): Promise<File> {
    throw new Error('Method not implemented.');
  }

  loadFile(name: string): Promise<File> {
    throw new Error('Method not implemented.');
  }

  async copyFile(name: string, newName: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async deleteFile(name: string): Promise<void> {
    this.items = this.items.filter(value => value.filename !== name);
  }

  async moveFile(name: string, newName: string): Promise<void> {
    for (let i = 0; i < this.items.length; i += 1) {
      if (this.items[i].filename === name) {
        this.items[i].filename = newName;
        this.items[i].basename = FileUtils.getBaseName(newName);
        this.items[i].id = newName;
        break;
      }
    }
  }

  async info(name: string): Promise<FileStorageItem> {
    const allItems = this.items.filter(value => value.filename === name);
    if (allItems.length === 0) {
      throw new FileNotFoundError();
    }
    if (allItems.length > 1) {
      throw new Error('More than one matching file found');
    }
    const itemDetails = allItems[0];

    return {
      filename: itemDetails.filename,
      basename: itemDetails.basename,
      id: itemDetails.filename,
      type: itemDetails.type,
    };
  }

  createDirectory(name: string): Promise<FileStorageItem> {
    throw new Error('Method not implemented.');
  }
}

export default MockFileStorage;
