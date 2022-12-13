import {
  CommandHistoryPanel,
  ConsolePanel,
  FileExplorerPanel,
  FilterSet,
  Link,
  LogPanel,
} from '@deephaven/dashboard-core-plugins';
import type { ItemConfigType } from '@deephaven/golden-layout';
import Log from '@deephaven/log';
import LayoutStorage, {
  ExportedLayout,
  ExportedLayoutV2,
  isLayoutV1,
  isLayoutV2,
} from '../storage/LayoutStorage';

const log = Log.module('UserLayoutUtils');

export const DEFAULT_LAYOUT_CONFIG: ExportedLayoutV2 = {
  layoutConfig: [
    {
      type: 'column',
      content: [
        {
          type: 'row',
          height: 40, // slightly smaller than 50-50 to allow more space for tables below
          content: [
            {
              type: 'stack',
              content: [
                {
                  type: 'react-component',
                  component: ConsolePanel.COMPONENT,
                  title: ConsolePanel.TITLE,
                  isClosable: false,
                },
                {
                  type: 'react-component',
                  component: LogPanel.COMPONENT,
                  title: LogPanel.TITLE,
                  isClosable: false,
                },
              ],
            },
            {
              type: 'stack',
              width: 25,
              content: [
                {
                  type: 'react-component',
                  component: CommandHistoryPanel.COMPONENT,
                  title: CommandHistoryPanel.TITLE,
                  isClosable: false,
                },
                {
                  type: 'react-component',
                  component: FileExplorerPanel.COMPONENT,
                  title: FileExplorerPanel.TITLE,
                  isClosable: false,
                },
              ],
            },
          ],
        },
        {
          type: 'row',
          content: [
            {
              type: 'stack',
              title: 'Notebooks',
              content: [],
            },
          ],
        },
      ],
    },
  ],
  links: [],
  filterSets: [],
  version: 2,
};

export const DEFAULT_LAYOUT_CONFIG_NO_CONSOLE: ExportedLayoutV2 = {
  layoutConfig: [],
  links: [],
  filterSets: [],
  version: 2,
};

export function normalizeLayout(layout: ExportedLayout): ExportedLayoutV2 {
  if (isLayoutV2(layout)) {
    return layout;
  }
  if (isLayoutV1(layout)) {
    const layoutConfig = layout;
    return {
      layoutConfig,
      links: [],
      filterSets: [],
      version: 2,
    };
  }

  throw new Error(`Unexpected layout import format: ${layout}`);
}

/**
 * Get the default layout for the user to use. Checks layout storage for any layouts, and uses the first one if found.
 * @param layoutStorage  The layout storage to get the default layouts from
 * @param isConsoleAvailable Whether console sessions are available.
 * @returns The default layout config to use
 */
export async function getDefaultLayout(
  layoutStorage: LayoutStorage,
  isConsoleAvailable = true
): Promise<ExportedLayoutV2> {
  try {
    const layouts = await layoutStorage.getLayouts();
    if (layouts.length > 0) {
      try {
        // We found a layout on the server, use it. It could be an empty layout if they want user to build their own
        const layout = await layoutStorage.getLayout(layouts[0]);
        return normalizeLayout(layout);
      } catch (err) {
        log.error('Unable to load layout', layouts[0], ':', err);
        log.warn('No valid layouts found, falling back to default layout');
      }
    }
  } catch (err) {
    log.error('Unable to fetch layout list', err);
    log.warn('Falling back to default layout');
  }
  // Otherwise, do the default layout
  return isConsoleAvailable
    ? DEFAULT_LAYOUT_CONFIG
    : DEFAULT_LAYOUT_CONFIG_NO_CONSOLE;
}

export function exportLayout(data: {
  filterSets: FilterSet[];
  links: Link[];
  layoutConfig: ItemConfigType[];
}): ExportedLayoutV2 {
  const { filterSets, layoutConfig, links } = data;
  const exportedLayout: ExportedLayoutV2 = {
    filterSets,
    layoutConfig,
    links,
    version: 2,
  };
  return exportedLayout;
}

export default { exportLayout, getDefaultLayout, normalizeLayout };
