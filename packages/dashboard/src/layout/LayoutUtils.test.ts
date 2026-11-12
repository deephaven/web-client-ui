import {
  itemDefaultConfig,
  type ContentItem,
  type ReactComponentConfig,
} from '@deephaven/golden-layout';
import { type DashboardLayoutConfig } from '../DashboardLayout';
import LayoutUtils, { LAYOUT_ITEM_DEFAULTS } from './LayoutUtils';

function makeContentItem(type = 'root'): Partial<ContentItem> {
  const contentItems = [];
  return {
    contentItems,
    addChild: jest.fn(childParam => {
      const child = Object.assign(makeContentItem(), childParam);
      if (child.type === 'column') {
        child.isColumn = true;
      } else if (child.type === 'row') {
        child.isRow = true;
      }
      child.isRoot = false;
      contentItems.push(child);
    }),
    removeChild: jest.fn(child => {
      const index = contentItems.indexOf(child);
      if (index >= 0) {
        contentItems.splice(index, 1);
      }
    }),
    replaceChild: jest.fn((oldChild, newChild) => {
      const index = contentItems.indexOf(oldChild);
      if (index >= 0) {
        contentItems[index] = newChild;
      }
    }),
    isComponent: type === 'component',
    isColumn: type === 'column',
    isRow: type === 'row',
    isRoot: type === 'root',
    type,
    layoutManager: {
      createContentItem: ({ type: newType }) => makeContentItem(newType),
    },
  };
}

describe('add stack functions properly', () => {
  const dummyStack = makeContentItem('stack');

  let callback;
  let addStack;

  beforeEach(() => {
    callback = {
      addStack: jest.fn(() => dummyStack),
    };

    addStack = LayoutUtils.addStack.bind(callback);
  });

  it('adds to basic root object properly', () => {
    const root = makeContentItem();
    const stack = addStack(root);
    expect(stack).toBe(dummyStack);
    expect(stack.type).toEqual('stack');
    expect(stack.contentItems.length).toBe(0);
    expect(callback.addStack).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'column', contentItems: [] }),
      true
    );
    expect(root).toMatchObject({
      type: 'root',
      contentItems: [
        {
          type: 'column',
          contentItems: [],
        },
      ],
    });
  });

  it('adds to an existing column properly', () => {
    const root = makeContentItem('column');

    addStack(root);
    expect(root).toMatchObject({
      type: 'column',
      contentItems: [{ type: 'stack' }],
    });
  });

  it('adds row to existing column properly', () => {
    const root = makeContentItem('column');
    const child1 = makeContentItem('component');
    const child2 = makeContentItem('component');
    root.addChild(child1 as ContentItem);
    root.addChild(child2 as ContentItem);

    const stack = addStack(root);
    expect(stack).toBe(dummyStack);
    expect(callback.addStack).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'row', contentItems: [child2] }),
      false
    );
  });
});

describe('getContentItemInStack', () => {
  it('finds item with the specified config', () => {
    const root = makeContentItem('column');
    const needle1 = Object.assign(makeContentItem('component'), {
      config: { id: 'needle1' },
    });
    const needle2 = Object.assign(makeContentItem('component'), {
      config: { id: 'needle2' },
    });
    root.addChild(needle1 as ContentItem);
    root.addChild(needle2 as ContentItem);

    const found = LayoutUtils.getContentItemInStack(root as ContentItem, {
      id: 'needle2',
    });
    expect(found).toEqual(needle2);
  });

  it('returns null if item with the specified config not found', () => {
    const root = makeContentItem('column');
    const needle1 = Object.assign(makeContentItem('component'), {
      config: { id: 'needle1' },
    });
    const needle2 = Object.assign(makeContentItem('component'), {
      config: { id: 'needle2' },
    });
    root.addChild(needle1 as ContentItem);
    root.addChild(needle2 as ContentItem);

    const found = LayoutUtils.getContentItemInStack(root as ContentItem, {
      id: 'noItemFound',
    });
    expect(found).toBeNull();
  });
});

describe('isEqual', () => {
  function makeComponentConfig(
    props: Record<string, unknown>
  ): ReactComponentConfig {
    return {
      component: 'ReactComponent',
      type: 'component',
      props,
    };
  }

  it('ignores the difference between undefined and missing properties', () => {
    expect(
      LayoutUtils.isEqual(
        [makeComponentConfig({ a: 1, b: undefined })],
        [makeComponentConfig({ a: 1 })]
      )
    ).toBe(true);
  });

  it('correctly differentiates null from undefined', () => {
    expect(
      LayoutUtils.isEqual(
        [makeComponentConfig({ a: 1, b: undefined })],
        [makeComponentConfig({ a: 1, b: null })]
      )
    ).toBe(false);
  });
});

describe('dehydrateLayoutConfig', () => {
  /** Panels are passed through as-is, to test only the layout item defaults */
  const dehydrateComponent = (_name: string, config: unknown) => config;

  function dehydrate(config: DashboardLayoutConfig): DashboardLayoutConfig {
    return LayoutUtils.dehydrateLayoutConfig(
      config,
      dehydrateComponent as Parameters<
        typeof LayoutUtils.dehydrateLayoutConfig
      >[1]
    ) as DashboardLayoutConfig;
  }

  /** Layout as produced by golden-layout `toConfig`, with every default value present */
  function makeGoldenLayoutConfig(): DashboardLayoutConfig {
    return [
      {
        type: 'column',
        id: 'column-id',
        isClosable: true,
        isFocusOnShow: true,
        reorderEnabled: true,
        title: '',
        content: [
          {
            type: 'stack',
            id: 'stack-id',
            isClosable: true,
            isFocusOnShow: true,
            reorderEnabled: true,
            title: '',
            width: 75,
            activeItemIndex: 0,
            content: [
              {
                type: 'react-component',
                component: 'ConsolePanel',
                title: 'Console',
                isClosable: false,
                id: 'console-id',
                props: { panelState: { itemIds: [] } },
                componentName: 'lm-react-component',
                isFocusOnShow: true,
                reorderEnabled: true,
                componentState: null,
              },
              {
                type: 'react-component',
                component: 'LogPanel',
                title: 'Log',
                isClosable: false,
                id: 'log-id',
                props: {},
                componentName: 'lm-react-component',
                isFocusOnShow: true,
                reorderEnabled: true,
                componentState: null,
              },
            ],
          },
          {
            type: 'stack',
            id: 'empty-stack-id',
            isClosable: true,
            isFocusOnShow: true,
            reorderEnabled: true,
            title: '',
            content: [],
          },
        ],
      },
    ] as DashboardLayoutConfig;
  }

  it('omits default values from every layout item', () => {
    expect(dehydrate(makeGoldenLayoutConfig())).toEqual([
      {
        type: 'column',
        id: 'column-id',
        content: [
          {
            type: 'stack',
            id: 'stack-id',
            width: 75,
            content: [
              {
                type: 'react-component',
                component: 'ConsolePanel',
                title: 'Console',
                isClosable: false,
                id: 'console-id',
                props: { panelState: { itemIds: [] } },
              },
              {
                type: 'react-component',
                component: 'LogPanel',
                title: 'Log',
                isClosable: false,
                id: 'log-id',
              },
            ],
          },
          { type: 'stack', id: 'empty-stack-id', content: [] },
        ],
      },
    ]);
  });

  it('keeps values that differ from the defaults', () => {
    const config = [
      {
        type: 'stack',
        isClosable: false,
        isFocusOnShow: false,
        reorderEnabled: false,
        title: 'Title',
        activeItemIndex: 1,
        content: [
          {
            type: 'react-component',
            component: 'Panel',
            componentName: 'other-component',
            componentState: { a: 1 },
            props: { metadata: { name: 'x' } },
          },
        ],
      },
    ] as DashboardLayoutConfig;
    expect(dehydrate(config)).toEqual(config);
  });

  it('keeps activeItemIndex on stacks without tabs', () => {
    const config = [
      { type: 'stack', activeItemIndex: 0, content: [] },
    ] as DashboardLayoutConfig;
    expect(dehydrate(config)).toEqual(config);
  });

  it('only omits component defaults from react-component items', () => {
    const config = [
      {
        type: 'component',
        componentName: 'lm-react-component',
        componentState: null,
      },
      { type: 'row', activeItemIndex: 0, props: {} },
    ] as unknown as DashboardLayoutConfig;
    expect(dehydrate(config)).toEqual(config);
  });

  it('does not modify the input', () => {
    const config = makeGoldenLayoutConfig();
    dehydrate(config);
    expect(config).toEqual(makeGoldenLayoutConfig());
  });
});

describe('LAYOUT_ITEM_DEFAULTS', () => {
  it('matches the defaults golden-layout applies to layout items', () => {
    const { type, ...goldenLayoutDefaults } = itemDefaultConfig;
    expect(LAYOUT_ITEM_DEFAULTS).toEqual(goldenLayoutDefaults);
  });
});

describe('getContentItemById', () => {
  it('finds item with the specified ID', () => {
    const root = makeContentItem('column');
    const needle1 = Object.assign(makeContentItem('component'), {
      config: { id: 'needle1' },
    });
    const needle2 = Object.assign(makeContentItem('component'), {
      config: { id: 'needle2' },
    });
    root.addChild(needle1 as ContentItem);
    root.addChild(needle2 as ContentItem);

    const found = LayoutUtils.getContentItemById(
      root as ContentItem,
      'needle2'
    );
    expect(found).toEqual(needle2);
  });

  it('returns null if item with the specified ID not found', () => {
    const root = makeContentItem('column');
    const needle1 = Object.assign(makeContentItem('component'), {
      config: { id: 'needle1' },
    });
    const needle2 = Object.assign(makeContentItem('component'), {
      config: { id: 'needle2' },
    });
    root.addChild(needle1 as ContentItem);
    root.addChild(needle2 as ContentItem);

    const found = LayoutUtils.getContentItemById(
      root as ContentItem,
      'noItemFound'
    );
    expect(found).toBeNull();
  });
});
