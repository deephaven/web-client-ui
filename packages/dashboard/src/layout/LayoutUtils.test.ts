import type {
  ContentItem,
  ReactComponentConfig,
} from '@deephaven/golden-layout';
import LayoutUtils from './LayoutUtils';

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
