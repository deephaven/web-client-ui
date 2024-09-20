import type { ItemConfig } from '@deephaven/golden-layout';
import { type FilterSet, type Link } from '@deephaven/dashboard-core-plugins';
import { type PluginDataMap } from '@deephaven/redux';

/**
 * Have a different version to support legacy layout exports
 */
export type ExportedLayoutV1 = ItemConfig[];

export type ExportedLayoutV2 = {
  filterSets: FilterSet[];
  links: Link[];
  layoutConfig: ItemConfig[];
  pluginDataMap?: PluginDataMap;
  version: 2;
};

export type ExportedLayout = ExportedLayoutV1 | ExportedLayoutV2;

export function isLayoutV2(layout: ExportedLayout): layout is ExportedLayoutV2 {
  return (layout as ExportedLayoutV2).version === 2;
}

export function isLayoutV1(layout: ExportedLayout): layout is ExportedLayoutV1 {
  return Array.isArray(layout);
}

/**
 * Interface for accessing layouts from wherever they are stored.
 */
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
  getLayout: (name: string) => Promise<ExportedLayout>;
}

export default LayoutStorage;
