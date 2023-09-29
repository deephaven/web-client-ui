/* eslint-disable class-methods-use-this */

import throttle from 'lodash.throttle';
import {
  FileNotFoundError,
  FileStorage,
  File,
  FileStorageItem,
  FileStorageTable,
  FileUtils,
} from '@deephaven/file-explorer';
import type { StorageService } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import GrpcFileStorageTable from './GrpcFileStorageTable';

const log = Log.module('GrpcFileStorage');

export class GrpcFileStorage implements FileStorage {
  private static readonly REFRESH_THROTTLE = 150;

  private readonly storageService: StorageService;

  private tables = [] as GrpcFileStorageTable[];

  private readonly root: string;

  /**
   * FileStorage implementation using gRPC
   * @param storageService Storage service to use
   * @param root Root path for this instance. Should not contain trailing slash.
   */
  constructor(storageService: StorageService, root = '') {
    this.storageService = storageService;
    this.root = root;
  }

  private removeRoot(filename: string): string {
    return FileUtils.removeRoot(this.root, filename);
  }

  private addRoot(path: string): string {
    return FileUtils.addRoot(this.root, path);
  }

  async createDirectory(path: string): Promise<FileStorageItem> {
    await this.storageService.createDirectory(this.addRoot(path));
    this.refreshTables();
    return {
      type: 'directory',
      id: path,
      filename: path,
      basename: FileUtils.getBaseName(path),
    };
  }

  async getTable(): Promise<FileStorageTable> {
    const table = new GrpcFileStorageTable(this.storageService, this.root);
    this.tables.push(table);
    return table;
  }

  async saveFile(file: File): Promise<File> {
    const fileContents = dh.storage.FileContents.text(file.content);
    await this.storageService.saveFile(
      this.addRoot(file.filename),
      fileContents,
      true
    );
    this.refreshTables();
    return file;
  }

  async loadFile(name: string): Promise<File> {
    const fileContents = await this.storageService.loadFile(this.addRoot(name));
    const content = await fileContents.text();
    return {
      filename: name,
      basename: FileUtils.getBaseName(name),
      content,
    };
  }

  async copyFile(name: string, newName: string): Promise<void> {
    const fileContents = await this.storageService.loadFile(this.addRoot(name));
    await this.storageService.saveFile(
      this.addRoot(newName),
      fileContents,
      false
    );
    this.refreshTables();
  }

  async deleteFile(name: string): Promise<void> {
    await this.storageService.deleteItem(this.addRoot(name));
    this.refreshTables();
  }

  async moveFile(name: string, newName: string): Promise<void> {
    await this.storageService.moveItem(
      this.addRoot(name),
      this.addRoot(newName)
    );
    this.refreshTables();
  }

  async info(name: string): Promise<FileStorageItem> {
    const allItems = await this.storageService.listItems(
      this.addRoot(FileUtils.getPath(name)),
      FileUtils.getBaseName(name)
    );
    if (allItems.length === 0) {
      throw new FileNotFoundError();
    }
    if (allItems.length > 1) {
      log.error(
        'More than one matching file found, should never happen.',
        allItems
      );
      throw new Error('More than one matching file found');
    }
    const itemDetails = allItems[0];
    return {
      filename: this.removeRoot(itemDetails.filename),
      basename: itemDetails.basename,
      id: this.removeRoot(itemDetails.filename),
      type: itemDetails.type,
    };
  }

  private refreshTables = throttle(() => {
    this.tables.forEach(table => table.refresh());
  }, GrpcFileStorage.REFRESH_THROTTLE);
}

export default GrpcFileStorage;
