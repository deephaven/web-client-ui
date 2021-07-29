import { ItemConfigType } from 'golden-layout';

export interface LayoutStorage {
  /**
   * Get the name of the layouts available
   * @returns The string array of layout names
   */
  getLayouts: () => Promise<string[]>;

  /**
   * Get the layout with the specified name
   * @param name The name of the layout to fetch
   * @returns GoldenLayout layout config
   */
  getLayout: (name: string) => Promise<ItemConfigType[]>;
}

export default LayoutStorage;
