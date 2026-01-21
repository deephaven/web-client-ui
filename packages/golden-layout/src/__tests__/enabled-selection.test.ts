import LayoutManager from '../LayoutManager';
import {
  createLayout,
  cleanupLayout,
  verifyPath,
} from '../test-utils/testUtils';

describe('selection works when enabled', () => {
  let layout: LayoutManager | null = null;

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
  });

  it('creates a layout', async () => {
    layout = await createLayout({
      settings: {
        selectionEnabled: true,
      },
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
      settings: {
        selectionEnabled: true,
      },
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

  it('clicks a header and it selects a stack', async () => {
    layout = await createLayout({
      settings: {
        selectionEnabled: true,
      },
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
    expect(headerElement.hasClass('lm_selectable')).toBe(true);
    expect(stackA.element.hasClass('lm_selected')).toBe(false);

    headerElement.trigger('click');

    expect(selectionChangedSpy).toHaveBeenCalledTimes(1);
    expect(layout.selectedItem).toBe(stackA);
    expect(stackA.element.hasClass('lm_selected')).toBe(true);
  });

  it('clicks changes selection', async () => {
    layout = await createLayout({
      settings: {
        selectionEnabled: true,
      },
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
    const stackB = components[1].parent!;

    // First click to select stackA
    stackA.element.find('.lm_header').trigger('click');

    const headerElement = stackB.element.find('.lm_header');
    expect(headerElement.length).toBe(1);
    expect(selectionChangedSpy).toHaveBeenCalledTimes(1);
    expect(layout.selectedItem).toBe(stackA);
    expect(headerElement.hasClass('lm_selectable')).toBe(true);
    expect(stackA.element.hasClass('lm_selected')).toBe(true);

    headerElement.trigger('click');

    expect(selectionChangedSpy).toHaveBeenCalledTimes(2);
    expect(layout.selectedItem).toBe(stackB);
    expect(stackA.element.hasClass('lm_selected')).toBe(false);
    expect(stackB.element.hasClass('lm_selected')).toBe(true);
  });

  it('changes selection programatically', async () => {
    layout = await createLayout({
      settings: {
        selectionEnabled: true,
      },
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
    const stackB = components[1].parent!;

    // First click on stackB
    stackB.element.find('.lm_header').trigger('click');

    const headerElement = stackA.element.find('.lm_header');
    expect(headerElement.length).toBe(1);
    expect(selectionChangedSpy).toHaveBeenCalledTimes(1);
    expect(layout.selectedItem).toBe(stackB);
    expect(headerElement.hasClass('lm_selectable')).toBe(true);
    expect(stackA.element.hasClass('lm_selected')).toBe(false);

    layout.selectItem(stackA);

    // selectItem triggers 2 events - one for deselection and one for selection
    expect(selectionChangedSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(layout.selectedItem).toBe(stackA);
    expect(stackA.element.hasClass('lm_selected')).toBe(true);
    expect(stackB.element.hasClass('lm_selected')).toBe(false);
  });

  it('destroys the layout', async () => {
    layout = await createLayout({
      settings: {
        selectionEnabled: true,
      },
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
