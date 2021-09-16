import { ItemConfigType } from '@deephaven/golden-layout';
import Log from '@deephaven/log';
import LayoutStorage from './LayoutStorage';
import {
  CommandHistoryPanel,
  ConsolePanel,
  FileExplorerPanel,
} from '../dashboard/plugins/panels';

const log = Log.module('UserLayoutUtils');

export const DEFAULT_LAYOUT_CONFIG = [
  {
    type: 'column',
    content: [
      {
        type: 'row',
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
];

/**
 * Get the default layout for the user to use. Checks layout storage for any layouts, and uses the first one if found.
 * @param layoutStorage  The layout storage to get the default layouts from
 * @returns The default layout config to use
 */
export const getDefaultLayout = async (
  layoutStorage: LayoutStorage
): Promise<ItemConfigType[]> => {
  const layouts = await layoutStorage.getLayouts();
  if (layouts.length > 0) {
    try {
      // We found a layout on the server, use it. It could be an empty layout if they want user to build their own
      const layout = await layoutStorage.getLayout(layouts[0]);
      return layout;
    } catch (err) {
      log.error('Unable to load layout', layouts[0], ':', err);
      log.warn('No valid layouts found, falling back to default layout');
    }
  }
  // Otherwise, do the default layout
  return DEFAULT_LAYOUT_CONFIG;
};

export default { getDefaultLayout };
