import { FilterSet, Link } from '@deephaven/dashboard-core-plugins';
import type { ItemConfigType } from '@deephaven/golden-layout';
import LayoutStorage, {
  ExportedLayout,
  ExportedLayoutV1,
  ExportedLayoutV2,
} from '../storage/LayoutStorage';
import UserLayoutUtils, {
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_LAYOUT_CONFIG_NO_CONSOLE,
} from './UserLayoutUtils';

const links: Link[] = [
  {
    start: {
      panelId: 'TestPanelId',
      columnName: 'TestColumnName',
      columnType: 'TestColumnType',
    },
    id: 'TEST',
    type: 'tableLink',
  },
];
const filterSets: FilterSet[] = [
  {
    id: 'TestId',
    title: 'TestTitle',
    panels: [],
  },
];
const layoutConfig: ItemConfigType[] = [
  {
    component: 'TestComponent',
    type: 'TestComponentType',
  },
];
const layoutV3 = ({
  links,
  filterSets,
  layoutConfig,
  another: 'another test property',
  version: 3,
} as unknown) as ExportedLayout;
const layoutV2: ExportedLayoutV2 = {
  links,
  filterSets,
  layoutConfig,
  version: 2,
};
const layoutV1: ExportedLayoutV1 = layoutConfig;

describe('normalizeLayout tests', () => {
  it('normalizes V2 layout correctly', () => {
    expect(UserLayoutUtils.normalizeLayout(layoutV2)).toEqual(
      expect.objectContaining({
        links: expect.arrayContaining(links),
        filterSets: expect.arrayContaining(filterSets),
        layoutConfig: expect.arrayContaining(layoutConfig),
        version: 2,
      })
    );
  });

  it('normalizes V1 layout correctly', () => {
    expect(UserLayoutUtils.normalizeLayout(layoutV1)).toEqual(
      expect.objectContaining({
        links: [],
        filterSets: [],
        layoutConfig: expect.arrayContaining(layoutConfig),
        version: 2,
      })
    );
  });

  it('throws on an unknown version correctly', () => {
    expect(() => UserLayoutUtils.normalizeLayout(layoutV3)).toThrow();
  });
});

describe('default layout', () => {
  it('loads the first layout that is found', async () => {
    const layoutNames = ['first', 'second'];
    const layoutStorage: LayoutStorage = {
      getLayouts: jest.fn(() => Promise.resolve(layoutNames)),
      getLayout: jest.fn(() => Promise.resolve(layoutV2)),
    };

    const layout = await UserLayoutUtils.getDefaultLayout(layoutStorage);
    expect(layout).toEqual(layoutV2);
    expect(layoutStorage.getLayout).toHaveBeenCalledWith(layoutNames[0]);
  });

  it('falls back to default layout when stored layout cannot be loaded', async () => {
    const layoutNames = ['first', 'second'];
    const layoutStorage: LayoutStorage = {
      getLayouts: jest.fn(() => Promise.resolve(layoutNames)),
      getLayout: jest.fn(() =>
        Promise.reject(new Error('Test corrupt layout'))
      ),
    };
    const layout = await UserLayoutUtils.getDefaultLayout(layoutStorage);
    expect(layout).toEqual(DEFAULT_LAYOUT_CONFIG);
    expect(layoutStorage.getLayouts).toHaveBeenCalled();
    expect(layoutStorage.getLayout).toHaveBeenCalledWith(layoutNames[0]);
  });

  it('falls back to default no console when stored layout cannot be loaded and no consoles are available', async () => {
    const layoutNames = ['first', 'second'];
    const layoutStorage: LayoutStorage = {
      getLayouts: jest.fn(() => Promise.resolve(layoutNames)),
      getLayout: jest.fn(() =>
        Promise.reject(new Error('Test corrupt layout'))
      ),
    };
    const layout = await UserLayoutUtils.getDefaultLayout(layoutStorage, false);
    expect(layout).toEqual(DEFAULT_LAYOUT_CONFIG_NO_CONSOLE);
    expect(layoutStorage.getLayouts).toHaveBeenCalled();
    expect(layoutStorage.getLayout).toHaveBeenCalledWith(layoutNames[0]);
  });
});

it('exports layout correctly', () => {
  expect(
    UserLayoutUtils.exportLayout({ filterSets, links, layoutConfig })
  ).toEqual(layoutV2);
});
