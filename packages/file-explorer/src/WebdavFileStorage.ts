/* eslint-disable class-methods-use-this */
import { WebDAVClient } from 'webdav/web';
import FileStorage, {
  DraftFile,
  FileStorageTable,
  LoadedFile,
} from './FileStorage';
import WebdavFileStorageTable from './WebdavFileStorageTable';

export class WebdavFileStorage implements FileStorage {
  readonly client;

  constructor(client: WebDAVClient) {
    this.client = client;
  }

  async getTable(): Promise<FileStorageTable> {
    return new WebdavFileStorageTable(this.client);
  }

  async saveFile(file: DraftFile): Promise<LoadedFile> {
    const id = file.id ?? file.name;
    const success = await this.client.putFileContents(id, file.content);
    if (!success) {
      throw new Error('Unable to write file');
    }
    return { id, name: file.name, content: file.content };
  }

  async loadFile(id: string): Promise<LoadedFile> {
    const content = (await this.client.getFileContents(id, {
      format: 'text',
    })) as string;
    return {
      id,
      name: id,
      content,
    };
  }

  async deleteFile(id: string): Promise<void> {
    await this.client.deleteFile(id);
  }
}

export default WebdavFileStorage;
