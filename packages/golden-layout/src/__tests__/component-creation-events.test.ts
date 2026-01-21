import LayoutManager from '../LayoutManager';
import type { ItemContainer } from '../container';
import type { InputConfig } from '../config';
import { cleanupLayout, waitForLayoutInit } from '../test-utils/testUtils';

describe('emits events when components are created', () => {
  let layout: LayoutManager | null = null;
  let eventListener: {
    show: jest.Mock;
    shown: jest.Mock;
  };

  beforeEach(() => {
    eventListener = {
      show: jest.fn(),
      shown: jest.fn(),
    };
  });

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
  });

  const createRecorderComponent = () =>
    class {
      constructor(cont: ItemContainer) {
        cont.getElement().html('that worked');
        cont.on('show', eventListener.show);
        cont.on('shown', eventListener.shown);
      }
    };

  const nestedConfig: InputConfig = {
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
  };

  const createTestLayout = (
    config: InputConfig,
    component: new (cont: ItemContainer) => unknown
  ): LayoutManager => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    const newLayout = new LayoutManager(config, container);
    newLayout.registerComponent('testComponent', component);
    return newLayout;
  };

  it('creates a layout', () => {
    layout = createTestLayout(nestedConfig, createRecorderComponent());
    expect(layout).toBeDefined();
  });

  it('registers listeners', async () => {
    layout = createTestLayout(nestedConfig, createRecorderComponent());

    expect(eventListener.show).not.toHaveBeenCalled();
    expect(eventListener.shown).not.toHaveBeenCalled();

    layout.init();
    await waitForLayoutInit(layout);
  });

  it('has called listeners', async () => {
    layout = createTestLayout(nestedConfig, createRecorderComponent());
    layout.init();
    await waitForLayoutInit(layout);

    expect(eventListener.show).toHaveBeenCalledTimes(1);
    expect(eventListener.shown).toHaveBeenCalledTimes(1);
  });

  it('destroys the layout', async () => {
    layout = createTestLayout(
      {
        content: [
          {
            type: 'component',
            componentName: 'testComponent',
          },
        ],
      },
      class {
        constructor(cont: ItemContainer) {
          cont.getElement().html('that worked');
        }
      }
    );

    layout.init();
    await waitForLayoutInit(layout);

    layout.destroy();
    expect(layout.root.contentItems.length).toBe(0);
  });
});
