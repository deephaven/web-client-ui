import LayoutManager from '../LayoutManager';
import {
  createLayout,
  cleanupLayout,
  verifyPath,
} from '../test-utils/testUtils';

describe('selection is disabled by default', () => {
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
              type: 'column',
              content: [
                {
                  type: 'component',
                  componentName: 'testComponent',
                  id: 'test',
                },
                {
                  type: 'component',
                  componentName: 'testComponent',
                  id: 'test',
                },
              ],
            },
            {
              type: 'row',
            },
          ],
        },
      ],
    });

    expect(layout.isInitialised).toBe(true);
    verifyPath('stack.0.column.0.stack.0.component', layout);
    verifyPath('stack.1.row', layout);
  });

  it('attaches event listeners and retrieves stacks', async () => {
    layout = await createLayout({
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
                  id: 'test',
                },
                {
                  type: 'component',
                  componentName: 'testComponent',
                  id: 'test',
                },
              ],
            },
            {
              type: 'row',
            },
          ],
        },
      ],
    });

    const components = layout.root.getItemsById('test');
    expect(components.length).toBe(2);

    const stackA = components[0].parent!;
    const stackB = components[1].parent!;

    expect(stackA.type).toBe('stack');
    expect(stackB.type).toBe('stack');
  });

  it('clicks a header, but nothing happens since enableSelection == false', async () => {
    layout = await createLayout({
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
                  id: 'test',
                },
                {
                  type: 'component',
                  componentName: 'testComponent',
                  id: 'test',
                },
              ],
            },
            {
              type: 'row',
            },
          ],
        },
      ],
    });

    const selectionChangedSpy = jest.fn();
    layout.on('selectionChanged', selectionChangedSpy);

    const components = layout.root.getItemsById('test');
    const stackA = components[0].parent!;

    const headerElement = stackA.element.find('.lm_header');
    expect(headerElement.length).toBe(1);
    expect(selectionChangedSpy).toHaveBeenCalledTimes(0);
    expect(layout.selectedItem).toBe(null);
    expect(headerElement.hasClass('lm_selectable')).toBe(false);

    headerElement.trigger('click');

    expect(selectionChangedSpy).toHaveBeenCalledTimes(0);
    expect(layout.selectedItem).toBe(null);
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
