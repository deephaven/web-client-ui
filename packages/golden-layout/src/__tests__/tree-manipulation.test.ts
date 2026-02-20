import LayoutManager from '../LayoutManager';
import {
  createLayout,
  cleanupLayout,
  verifyPath,
} from '../test-utils/testUtils';

describe('The layout can be manipulated at runtime', () => {
  let myLayout: LayoutManager | null = null;

  afterEach(() => {
    cleanupLayout(myLayout);
    myLayout = null;
  });

  it('Creates an initial layout', async () => {
    myLayout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });
    expect(myLayout.isInitialised).toBe(true);
  });

  it('has the right initial structure', async () => {
    myLayout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    verifyPath('stack.0.component', myLayout);
  });

  it('adds a child to the stack', async () => {
    myLayout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    myLayout.root.contentItems[0].addChild({
      type: 'component',
      componentName: 'testComponent',
    });

    expect(myLayout.root.contentItems[0].contentItems.length).toBe(2);
    verifyPath('stack.1.component', myLayout);
  });

  it('replaces a component with a row of components', async () => {
    myLayout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    // Add a second component first
    myLayout.root.contentItems[0].addChild({
      type: 'component',
      componentName: 'testComponent',
    });

    const oldChild = myLayout.root.contentItems[0].contentItems[1];
    const newChild = {
      type: 'row' as const,
      content: [
        {
          type: 'component' as const,
          componentName: 'testComponent',
        },
        {
          type: 'component' as const,
          componentName: 'testComponent',
        },
      ],
    };

    myLayout.root.contentItems[0].replaceChild(oldChild, newChild);

    verifyPath('stack.1.row.0.stack.0.component', myLayout);
    verifyPath('stack.1.row.1.stack.0.component', myLayout);
  });

  it('Has setup parents correctly', async () => {
    myLayout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    // Add child and replace to create structure
    myLayout.root.contentItems[0].addChild({
      type: 'component',
      componentName: 'testComponent',
    });

    const oldChild = myLayout.root.contentItems[0].contentItems[1];
    myLayout.root.contentItems[0].replaceChild(oldChild, {
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
    });

    const component = verifyPath('stack.1.row.1.stack.0.component', myLayout);
    expect(component.isComponent).toBe(true);
    expect(component.parent.isStack).toBe(true);
    expect(component.parent.parent.isRow).toBe(true);
    expect(component.parent.parent.parent.isStack).toBe(true);
    expect(component.parent.parent.parent.parent.isRoot).toBe(true);
  });

  it('Destroys a component and its parent', async () => {
    myLayout = await createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    // Add child and replace to create structure
    myLayout.root.contentItems[0].addChild({
      type: 'component',
      componentName: 'testComponent',
    });

    const oldChild = myLayout.root.contentItems[0].contentItems[1];
    myLayout.root.contentItems[0].replaceChild(oldChild, {
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
    });

    const stack = verifyPath('stack.1.row.1.stack', myLayout);
    expect(stack.contentItems.length).toBe(1);
    stack.contentItems[0].remove();
    expect(stack.contentItems.length).toBe(0);
  });
});
