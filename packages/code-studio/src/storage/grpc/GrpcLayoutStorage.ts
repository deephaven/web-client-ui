import type { dh } from '@deephaven/jsapi-types';
import LayoutStorage, { ExportedLayout } from '../LayoutStorage';

export class GrpcLayoutStorage implements LayoutStorage {
  readonly storageService: dh.storage.StorageService;

  readonly root: string;

  /**
   *
   * @param storageService The gRPC storage service to use
   * @param root The root path where the layouts are stored
   */
  constructor(storageService: dh.storage.StorageService, root = '') {
    this.storageService = storageService;
    this.root = root;
  }

  async getLayouts(): Promise<string[]> {
    const files = await this.storageService.listItems(this.root, '*.json');

    return files.map(file => file.basename);
  }

  async getLayout(name: string): Promise<ExportedLayout> {
    const fileContents = await this.storageService.loadFile(
      `${this.root}/${name}`
    );
    const content = await fileContents.text();

    return JSON.parse(content);
  }
}

export default GrpcLayoutStorage;
