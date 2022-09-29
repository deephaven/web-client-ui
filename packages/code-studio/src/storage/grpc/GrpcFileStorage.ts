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
import { StorageService } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import GrpcFileStorageTable from './GrpcFileStorageTable';

const log = Log.module('GrpcFileStorage');

export class GrpcFileStorage implements FileStorage {
  private static readonly REFRESH_THROTTLE = 150;

  private readonly storageService: StorageService;

  private tables = [] as GrpcFileStorageTable[];

  private readonly root: string;

  constructor(storageService: StorageService, root = '/') {
    this.storageService = storageService;
    this.root = root;
  }

  async createDirectory(path: string): Promise<FileStorageItem> {
    await this.storageService.createDirectory(`${this.root}${path}`);
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
      `${this.root}${file.filename}`,
      fileContents
    );
    this.refreshTables();
    return file;
  }

  async loadFile(name: string): Promise<File> {
    const fileContents = await this.storageService.loadFile(
      `${this.root}${name}`
    );
    const content = await fileContents.text();
    return {
      filename: name,
      basename: FileUtils.getBaseName(name),
      content,
    };
  }

  async deleteFile(name: string): Promise<void> {
    await this.storageService.deleteItem(`${this.root}${name}`);
    this.refreshTables();
  }

  async moveFile(name: string, newName: string): Promise<void> {
    await this.storageService.moveItem(
      `${this.root}${name}`,
      `${this.root}${newName}`
    );
    this.refreshTables();
  }

  async info(name: string): Promise<FileStorageItem> {
    const allItems = await this.storageService.listItems(
      `${this.root}${FileUtils.getPath(name)}`,
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
      filename: itemDetails.filename,
      basename: itemDetails.basename,
      id: itemDetails.filename,
      type: itemDetails.type,
    };
  }

  private refreshTables = throttle(() => {
    this.tables.every(table => table.refresh().catch(() => undefined));
  }, GrpcFileStorage.REFRESH_THROTTLE);
}

export default GrpcFileStorage;
