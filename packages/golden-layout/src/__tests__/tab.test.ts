import LayoutManager from '../LayoutManager';
import { Stack } from '../items';
import { createLayout, cleanupLayout } from '../test-utils/testUtils';

describe('tabs apply their configuration', () => {
  let layout: LayoutManager | null = null;

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
  });

  it('creates a layout', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              reorderEnabled: false,
            },
          ],
        },
      ],
    });

    expect(layout.isInitialised).toBe(true);
  });

  it('attached a drag listener to the first tab', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              reorderEnabled: false,
            },
          ],
        },
      ],
    });

    const item1 = layout.root.contentItems[0].contentItems[0];
    const item2 = layout.root.contentItems[0].contentItems[1];
    const stack = layout.root.contentItems[0] as Stack;
    const { header } = stack;

    expect(header.tabs.length).toBe(2);

    expect(item1.type).toBe('component');
    expect(item1.config.reorderEnabled).toBe(true);
    // _dragListener is a private property, use bracket notation to access
    expect(
      (header.tabs[0] as unknown as { _dragListener: unknown })._dragListener
    ).toBeDefined();

    expect(item2.type).toBe('component');
    expect(item2.config.reorderEnabled).toBe(false);
    expect(
      (header.tabs[1] as unknown as { _dragListener: unknown })._dragListener
    ).not.toBeDefined();
  });

  it('destroys the layout', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    layout.destroy();
    expect(layout.root.contentItems.length).toBe(0);
  });
});
