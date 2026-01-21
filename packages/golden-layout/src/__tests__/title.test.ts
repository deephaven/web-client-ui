import LayoutManager from '../LayoutManager';
import { Stack, Component } from '../items';
import type { StackItemConfig, ComponentConfig } from '../config';
import { createLayout, cleanupLayout } from '../test-utils/testUtils';

describe('title functionality works correctly', () => {
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
              title: 'First Title',
              id: 'hasTitle',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'noTitle',
            },
          ],
        },
      ],
    });

    expect(layout.isInitialised).toBe(true);
  });

  it('applies titles from configuration', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              title: 'First Title',
              id: 'hasTitle',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'noTitle',
            },
          ],
        },
      ],
    });

    const itemWithTitle = layout.root.getItemsById('hasTitle')[0];
    const itemWithoutTitle = layout.root.getItemsById('noTitle')[0];

    expect(itemWithTitle.config.title).toBe('First Title');
    expect(itemWithoutTitle.config.title).toBe('testComponent');
  });

  it('displays the title on the tab', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              title: 'First Title',
              id: 'hasTitle',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'noTitle',
            },
          ],
        },
      ],
    });

    const stack = layout.root.getItemsByType('stack')[0] as Stack;
    expect(stack.header.tabs.length).toBe(2);
    expect(stack.header.tabs[0].element.find('.lm_title').html()).toBe(
      'First Title'
    );
    expect(stack.header.tabs[1].element.find('.lm_title').html()).toBe(
      'testComponent'
    );
  });

  it('updates the title when calling setTitle on the item', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              title: 'First Title',
              id: 'hasTitle',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'noTitle',
            },
          ],
        },
      ],
    });

    const itemWithTitle = layout.root.getItemsById('hasTitle')[0] as Component;
    const stack = layout.root.getItemsByType('stack')[0] as Stack;

    itemWithTitle.setTitle('Second Title');
    expect(stack.header.tabs[0].element.find('.lm_title').html()).toBe(
      'Second Title'
    );
  });

  it('updates the title when calling setTitle from the container', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              title: 'First Title',
              id: 'hasTitle',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'noTitle',
            },
          ],
        },
      ],
    });

    const itemWithTitle = layout.root.getItemsById('hasTitle')[0] as Component;
    const stack = layout.root.getItemsByType('stack')[0] as Stack;

    itemWithTitle.container.setTitle('Third Title');
    expect(stack.header.tabs[0].element.find('.lm_title').html()).toBe(
      'Third Title'
    );
  });

  it('Persists the title', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              title: 'First Title',
              id: 'hasTitle',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'noTitle',
            },
          ],
        },
      ],
    });

    const itemWithTitle = layout.root.getItemsById('hasTitle')[0] as Component;
    itemWithTitle.container.setTitle('Third Title');

    const stackConfig = layout.toConfig().content[0] as StackItemConfig;
    const componentConfig = stackConfig.content![0] as ComponentConfig;
    expect(componentConfig.title).toBe('Third Title');
  });

  it('supports html in title', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              title: 'First Title',
              id: 'hasTitle',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'noTitle',
            },
          ],
        },
      ],
    });

    const itemWithTitle = layout.root.getItemsById('hasTitle')[0] as Component;
    const stack = layout.root.getItemsByType('stack')[0] as Stack;

    itemWithTitle.container.setTitle('title <b>with</b> html');
    expect(stack.header.tabs[0].element.find('.lm_title').html()).toBe(
      'title &lt;b&gt;with&lt;/b&gt; html'
    );
    expect(stack.header.tabs[0].element.find('.lm_title').text()).toBe(
      'title <b>with</b> html'
    );
  });
});
