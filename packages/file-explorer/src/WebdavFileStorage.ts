/* eslint-disable class-methods-use-this */
import { WebDAVClient } from 'webdav/web';
import FileStorage, {
  File,
  FileStorageItem,
  FileStorageTable,
} from './FileStorage';
import FileUtils from './FileUtils';
import WebdavFileStorageTable from './WebdavFileStorageTable';

export class WebdavFileStorage implements FileStorage {
  readonly client;

  private tables = [] as WebdavFileStorageTable[];

  constructor(client: WebDAVClient) {
    this.client = client;
  }

  async createDirectory(path: string): Promise<FileStorageItem> {
    await this.client.createDirectory(path);
    this.refreshTables();
    return {
      type: 'directory',
      id: path,
      filename: path,
      basename: FileUtils.getBaseName(path),
    };
  }

  async getTable(): Promise<FileStorageTable> {
    const table = new WebdavFileStorageTable(this.client);
    this.tables.push(table);
    return table;
  }

  async saveFile(file: File): Promise<File> {
    const success = await this.client.putFileContents(
      file.filename,
      file.content
    );
    if (!success) {
      throw new Error('Unable to write file');
    }
    this.refreshTables();
    return file;
  }

  async loadFile(name: string): Promise<File> {
    const content = (await this.client.getFileContents(name, {
      format: 'text',
    })) as string;
    return {
      filename: name,
      basename: FileUtils.getBaseName(name),
      content,
    };
  }

  async deleteFile(name: string): Promise<void> {
    await this.client.deleteFile(name);
    this.refreshTables();
  }

  async moveFile(name: string, newName: string): Promise<void> {
    await this.client.moveFile(name, newName);
    this.refreshTables();
  }

  private refreshTables(): void {
    this.tables.every(table => table.refresh().catch(() => undefined));
  }
}

export default WebdavFileStorage;
