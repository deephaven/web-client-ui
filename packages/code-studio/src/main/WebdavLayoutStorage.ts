import { ItemConfigType } from 'golden-layout';
import { FileStat, WebDAVClient } from 'webdav/web';
import LayoutStorage from './LayoutStorage';

export class WebdavLayoutStorage implements LayoutStorage {
  readonly client: WebDAVClient;

  readonly root: string;

  /**
   *
   * @param client The WebDAV client instance to use
   * @param root The root path where the layouts are stored
   */
  constructor(client: WebDAVClient, root = '/') {
    this.client = client;
    this.root = root;
  }

  async getLayouts(): Promise<string[]> {
    const files = (await this.client.getDirectoryContents(
      this.root
    )) as FileStat[];

    return files.map(file => file.basename);
  }

  async getLayout(name: string): Promise<ItemConfigType[]> {
    let content = await this.client.getFileContents(`${this.root}${name}`, {
      format: 'text',
    });

    // For some reason, even though we specify the format as 'text', it comes back as whatever it wants
    // Just being safe here.
    if (Array.isArray(content)) {
      return content;
    }

    if (typeof content !== 'string') {
      content = `${content}`;
    }

    return JSON.parse(content);
  }
}

export default WebdavLayoutStorage;
