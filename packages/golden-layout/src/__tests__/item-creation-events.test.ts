import LayoutManager from '../LayoutManager';
import type { InputConfig } from '../config';
import {
  TestComponent,
  cleanupLayout,
  waitForLayoutInit,
} from '../test-utils/testUtils';

describe('emits events when items are created', () => {
  let layout: LayoutManager | null = null;
  let eventListener: {
    onItemCreated: jest.Mock;
    onStackCreated: jest.Mock;
    onComponentCreated: jest.Mock;
    onRowCreated: jest.Mock;
    onColumnCreated: jest.Mock;
  };

  beforeEach(() => {
    eventListener = {
      onItemCreated: jest.fn(),
      onStackCreated: jest.fn(),
      onComponentCreated: jest.fn(),
      onRowCreated: jest.fn(),
      onColumnCreated: jest.fn(),
    };
  });

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
  });

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
          {
            type: 'row',
          },
        ],
      },
    ],
  };

  const createTestLayout = (config: InputConfig): LayoutManager => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    const newLayout = new LayoutManager(config, container);
    newLayout.registerComponent('testComponent', TestComponent);
    return newLayout;
  };

  const registerEventListeners = (mgr: LayoutManager): void => {
    mgr.on('itemCreated', eventListener.onItemCreated);
    mgr.on('stackCreated', eventListener.onStackCreated);
    mgr.on('rowCreated', eventListener.onRowCreated);
    mgr.on('columnCreated', eventListener.onColumnCreated);
    mgr.on('componentCreated', eventListener.onComponentCreated);
  };

  it('creates a layout', () => {
    layout = createTestLayout(nestedConfig);
    expect(layout).toBeDefined();
  });

  it('registers listeners', async () => {
    layout = createTestLayout(nestedConfig);

    expect(eventListener.onItemCreated).not.toHaveBeenCalled();
    expect(eventListener.onStackCreated).not.toHaveBeenCalled();
    expect(eventListener.onRowCreated).not.toHaveBeenCalled();
    expect(eventListener.onColumnCreated).not.toHaveBeenCalled();
    expect(eventListener.onComponentCreated).not.toHaveBeenCalled();

    registerEventListeners(layout);
    layout.init();
    await waitForLayoutInit(layout);
  });

  it('has called listeners', async () => {
    layout = createTestLayout(nestedConfig);
    registerEventListeners(layout);
    layout.init();
    await waitForLayoutInit(layout);

    expect(eventListener.onItemCreated).toHaveBeenCalledTimes(6);
    expect(eventListener.onStackCreated).toHaveBeenCalledTimes(2);
    expect(eventListener.onRowCreated).toHaveBeenCalledTimes(1);
    expect(eventListener.onColumnCreated).toHaveBeenCalledTimes(1);
    expect(eventListener.onComponentCreated).toHaveBeenCalledTimes(1);
  });

  it('provides the right arguments', async () => {
    layout = createTestLayout(nestedConfig);
    registerEventListeners(layout);
    layout.init();
    await waitForLayoutInit(layout);

    const componentCalls = eventListener.onComponentCreated.mock.calls;
    const stackCalls = eventListener.onStackCreated.mock.calls;
    const columnCalls = eventListener.onColumnCreated.mock.calls;
    const rowCalls = eventListener.onRowCreated.mock.calls;

    expect(componentCalls[componentCalls.length - 1][0].type).toEqual(
      'component'
    );
    expect(stackCalls[stackCalls.length - 1][0].type).toEqual('stack');
    expect(columnCalls[columnCalls.length - 1][0].type).toEqual('column');
    expect(rowCalls[rowCalls.length - 1][0].type).toEqual('row');
  });
});
