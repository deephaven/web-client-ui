import $ from 'jquery';
import LayoutManager from '../LayoutManager';
import type { ItemContainer } from '../container';
import { Component, Stack } from '../items';
import {
  createLayout,
  cleanupLayout,
  waitForLayoutInit,
} from '../test-utils/testUtils';

class FocusableComponent {
  constructor(container: ItemContainer) {
    container.getElement().html('<button type="button">focus target</button>');
  }
}

class NestedDashboardComponent {
  innerLayout: LayoutManager;

  constructor(container: ItemContainer) {
    const nestedHost = document.createElement('div');
    nestedHost.style.width = '100%';
    nestedHost.style.height = '100%';
    container.getElement().append(nestedHost);

    this.innerLayout = new LayoutManager(
      {
        content: [
          {
            type: 'stack',
            content: [
              {
                type: 'component',
                componentName: 'innerComponent',
              },
            ],
          },
        ],
      },
      nestedHost
    );

    this.innerLayout.registerComponent('innerComponent', FocusableComponent);
    this.innerLayout.init();

    container.on('destroy', () => {
      this.innerLayout.destroy();
    });
  }
}

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

  it('keeps focus styling on the nested dashboard tab', async () => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    layout = new LayoutManager(
      {
        content: [
          {
            type: 'stack',
            content: [
              {
                type: 'component',
                componentName: 'nestedDashboard',
              },
            ],
          },
        ],
      },
      container
    );

    layout.registerComponent('nestedDashboard', NestedDashboardComponent);
    layout.init();
    await waitForLayoutInit(layout);

    const outerStack = layout.root.contentItems[0] as Stack;
    const outerTab = outerStack.header.tabs[0];
    const nestedLayoutHost = outerStack.contentItems[0] as Component;
    const nestedComponent =
      nestedLayoutHost.instance as NestedDashboardComponent;
    await waitForLayoutInit(nestedComponent.innerLayout);

    const innerStack = nestedComponent.innerLayout.root
      .contentItems[0] as Stack;
    const innerTab = innerStack.header.tabs[0];
    const innerComponent = innerStack.contentItems[0] as Component;
    const focusTarget = innerComponent.container
      .getElement()
      .find('button')[0] as HTMLButtonElement;

    focusTarget.focus();

    expect(innerTab.element.hasClass('lm_focusin')).toBe(true);
    expect(outerTab.element.hasClass('lm_focusin')).toBe(false);

    outerTab.element.trigger($.Event('click', { button: 0 }));

    expect(outerTab.element.hasClass('lm_focusin')).toBe(true);
    expect(innerTab.element.hasClass('lm_focusin')).toBe(false);
  });
});
