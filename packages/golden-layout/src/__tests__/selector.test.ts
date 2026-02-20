import LayoutManager from '../LayoutManager';
import {
  createLayout,
  cleanupLayout,
  verifyPath,
  TestComponent,
} from '../test-utils/testUtils';

describe('it is possible to select elements from the tree using selectors', () => {
  let layout: LayoutManager | null = null;

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
  });

  it('creates a layout with elements that have ids', async () => {
    const config = {
      content: [
        {
          type: 'column' as const,
          content: [
            {
              type: 'component' as const,
              id: 'simpleStringId',
              componentName: 'testComponent',
            },
            {
              type: 'column' as const,
              id: ['outerColumn', 'groupA', 'groupB'],
              content: [
                {
                  type: 'column' as const,
                  id: ['groupB'],
                },
              ],
            },
          ],
        },
      ],
    };
    layout = await createLayout(config);
    verifyPath('column.0.stack.0.component', layout);
    verifyPath('column.1.column.0.column', layout);
  });

  it('finds an item by string id', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'column',
          content: [
            {
              type: 'component',
              id: 'simpleStringId',
              componentName: 'testComponent',
            },
            {
              type: 'column',
              id: ['outerColumn', 'groupA', 'groupB'],
              content: [
                {
                  type: 'column',
                  id: ['groupB'],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(layout.isInitialised).toBe(true);
    const items = layout.root.getItemsById('simpleStringId');
    expect(items.length).toBe(1);
    expect(items[0].isComponent).toBe(true);
  });

  it('returns an empty array if no item was found for id', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'column',
          content: [
            {
              type: 'component',
              id: 'simpleStringId',
              componentName: 'testComponent',
            },
          ],
        },
      ],
    });

    const items = layout.root.getItemsById('doesNotExist');
    expect(items instanceof Array).toBe(true);
    expect(items.length).toBe(0);
  });

  it('finds items by an id from an array', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'column',
          content: [
            {
              type: 'component',
              id: 'simpleStringId',
              componentName: 'testComponent',
            },
            {
              type: 'column',
              id: ['outerColumn', 'groupA', 'groupB'],
              content: [
                {
                  type: 'column',
                  id: ['groupB'],
                },
              ],
            },
          ],
        },
      ],
    });

    let items = layout.root.getItemsById('groupB');
    expect(items.length).toBe(2);

    items = layout.root.getItemsById('groupA');
    expect(items.length).toBe(1);
  });

  it('finds items by type', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'column',
          content: [
            {
              type: 'component',
              id: 'simpleStringId',
              componentName: 'testComponent',
            },
            {
              type: 'column',
              id: ['outerColumn', 'groupA', 'groupB'],
              content: [
                {
                  type: 'column',
                  id: ['groupB'],
                },
              ],
            },
          ],
        },
      ],
    });

    const items = layout.root.getItemsByType('column');
    expect(items.length).toBe(3);
    expect(items[0].type).toBe('column');
    expect(items[1].type).toBe('column');
  });

  it('returns an empty array if no item was found for type', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'column',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
            },
          ],
        },
      ],
    });

    const items = layout.root.getItemsByType('row');
    expect(items instanceof Array).toBe(true);
    expect(items.length).toBe(0);
  });

  it('finds the component instance by name', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'column',
          content: [
            {
              type: 'component',
              id: 'simpleStringId',
              componentName: 'testComponent',
            },
          ],
        },
      ],
    });

    const components = layout.root.getComponentsByName('testComponent');
    expect(components.length).toBe(1);
    expect((components[0] as TestComponent).isTestComponentInstance).toBe(true);
  });

  it('allows for chaining', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'column',
          content: [
            {
              type: 'component',
              id: 'simpleStringId',
              componentName: 'testComponent',
            },
            {
              type: 'column',
              id: ['outerColumn', 'groupA', 'groupB'],
              content: [
                {
                  type: 'column',
                  id: ['groupB'],
                },
              ],
            },
          ],
        },
      ],
    });

    const innerColumns = layout.root
      .getItemsById('outerColumn')[0]
      .getItemsByType('column');

    expect(innerColumns.length).toBe(1);
    expect(innerColumns[0].type).toBe('column');
  });
});
