import LayoutManager from '../LayoutManager';
import { createLayout, cleanupLayout } from '../test-utils/testUtils';

describe('The layout can handle empty stacks', () => {
  let myLayout: LayoutManager | null = null;

  afterEach(() => {
    cleanupLayout(myLayout);
    myLayout = null;
  });

  it('Creates an initial layout', async () => {
    myLayout = await createLayout({
      content: [
        {
          type: 'row',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              componentState: { text: 'Component 1' },
            },
            {
              type: 'component',
              componentName: 'testComponent',
              componentState: { text: 'Component 2' },
            },
            {
              isClosable: false,
              type: 'stack',
              content: [],
            },
          ],
        },
      ],
    });

    expect(myLayout.isInitialised).toBe(true);
  });

  it('can manipulate the layout tree with an empty item present', async () => {
    myLayout = await createLayout({
      content: [
        {
          type: 'row',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              componentState: { text: 'Component 1' },
            },
            {
              type: 'component',
              componentName: 'testComponent',
              componentState: { text: 'Component 2' },
            },
            {
              isClosable: false,
              type: 'stack',
              content: [],
            },
          ],
        },
      ],
    });

    const row = myLayout.root.contentItems[0];
    expect(row.isRow).toBe(true);

    row.addChild({
      type: 'component',
      componentName: 'testComponent',
    });
  });

  it('can add children to the empty stack', async () => {
    myLayout = await createLayout({
      content: [
        {
          type: 'row',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              componentState: { text: 'Component 1' },
            },
            {
              type: 'component',
              componentName: 'testComponent',
              componentState: { text: 'Component 2' },
            },
            {
              isClosable: false,
              type: 'stack',
              content: [],
            },
          ],
        },
      ],
    });

    const stack = myLayout.root.contentItems[0].contentItems[2];
    expect(stack.isStack).toBe(true);
    expect(stack.contentItems.length).toBe(0);

    stack.addChild({
      type: 'component',
      componentName: 'testComponent',
    });

    expect(stack.contentItems.length).toBe(1);
  });
});
