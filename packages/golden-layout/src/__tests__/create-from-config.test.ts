import LayoutManager from '../LayoutManager';
import type { ItemContainer } from '../container';
import type { PartialConfig } from '../config';
import { cleanupLayout } from '../test-utils/testUtils';

describe('Creates the right structure based on the provided config', () => {
  let layout: LayoutManager | null = null;

  const createLayout = (config: PartialConfig): LayoutManager => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    const myLayout = new LayoutManager(config, container);

    myLayout.registerComponent(
      'testComponent',
      class {
        constructor(cont: ItemContainer) {
          cont.getElement().html('that worked');
        }
      }
    );

    myLayout.init();

    return myLayout;
  };

  const waitForInit = (myLayout: LayoutManager): Promise<void> => {
    return new Promise(resolve => {
      if (myLayout.isInitialised) {
        resolve();
      } else {
        myLayout.on('initialised', () => resolve());
      }
    });
  };

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
  });

  it('creates the right primitive types: component only', async () => {
    layout = createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    await waitForInit(layout);

    expect(layout.isInitialised).toBe(true);
    expect(layout.root.isRoot).toBe(true);
    expect(layout.root.contentItems.length).toBe(1);
    expect(layout.root.contentItems[0].isStack).toBe(true);
    expect(layout.root.contentItems[0].contentItems[0].isComponent).toBe(true);
  });

  it('creates the right primitive types: stack and component', async () => {
    layout = createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
            },
          ],
        },
      ],
    });

    await waitForInit(layout);

    expect(layout.isInitialised).toBe(true);
    expect(layout.root.isRoot).toBe(true);
    expect(layout.root.contentItems.length).toBe(1);
    expect(layout.root.contentItems[0].isStack).toBe(true);
    expect(layout.root.contentItems[0].contentItems[0].isComponent).toBe(true);
  });

  it('creates the right primitive types: row and two component', async () => {
    layout = createLayout({
      content: [
        {
          type: 'row',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
            },
            {
              type: 'component',
              componentName: 'testComponent',
            },
          ],
        },
      ],
    });

    await waitForInit(layout);

    expect(layout.isInitialised).toBe(true);
    expect(layout.root.contentItems.length).toBe(1);
    expect(layout.root.contentItems[0].isRow).toBe(true);
    expect(layout.root.contentItems[0].contentItems[0].isStack).toBe(true);
    expect(layout.root.contentItems[0].contentItems[1].isStack).toBe(true);
    expect(layout.root.contentItems[0].contentItems.length).toBe(2);
    expect(
      layout.root.contentItems[0].contentItems[0].contentItems[0].isComponent
    ).toBe(true);
    expect(
      layout.root.contentItems[0].contentItems[1].contentItems[0].isComponent
    ).toBe(true);
  });

  it('creates the right primitive types: stack -> column -> component', async () => {
    layout = createLayout({
      content: [
        {
          type: 'stack',
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
        },
      ],
    });

    await waitForInit(layout);

    expect(layout.isInitialised).toBe(true);

    expect(layout.root.contentItems.length).toBe(1);
    expect(layout.root.contentItems[0].isStack).toBe(true);

    expect(layout.root.contentItems[0].contentItems.length).toBe(1);
    expect(layout.root.contentItems[0].contentItems[0].isColumn).toBe(true);

    expect(
      layout.root.contentItems[0].contentItems[0].contentItems.length
    ).toBe(1);
    expect(
      layout.root.contentItems[0].contentItems[0].contentItems[0].isStack
    ).toBe(true);

    expect(
      layout.root.contentItems[0].contentItems[0].contentItems[0].contentItems
        .length
    ).toBe(1);
    expect(
      layout.root.contentItems[0].contentItems[0].contentItems[0]
        .contentItems[0].isComponent
    ).toBe(true);
  });
});
