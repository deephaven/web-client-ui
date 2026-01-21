import LayoutManager from '../LayoutManager';
import { BubblingEvent } from '../utils';
import {
  createLayout,
  cleanupLayout,
  verifyPath,
} from '../test-utils/testUtils';

describe('content items are abled to to emit events that bubble up the tree', () => {
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

    verifyPath('stack.0.column.0.stack.0.component', layout);
    verifyPath('stack.1.row', layout);
  });

  it('emits bubbling events', async () => {
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

    const invocations: string[] = [];
    const eventName = 'eventA';
    let hasReachedLayout = false;

    layout.root.contentItems[0].contentItems[0].contentItems[0].contentItems[0].on(
      eventName,
      () => {
        invocations.push('component');
      }
    );

    layout.root.contentItems[0].contentItems[0].contentItems[0].on(
      eventName,
      () => {
        invocations.push('stackBottom');
      }
    );

    layout.root.contentItems[0].contentItems[0].on(eventName, () => {
      invocations.push('column');
    });

    layout.root.contentItems[0].on(eventName, () => {
      invocations.push('stackTop');
    });

    layout.root.on(eventName, (event: BubblingEvent) => {
      invocations.push('root');
      expect((event.origin as { type: string }).type).toBe('component');
    });

    layout.on(eventName, () => {
      hasReachedLayout = true;
      invocations.push('layout');
    });

    layout.root.getItemsByType('row')[0].on(eventName, () => {
      expect('this').toBe('never called');
    });

    layout.root.getItemsByType('component')[0].emitBubblingEvent(eventName);

    // Wait for event to propagate
    await new Promise<void>(resolve => {
      const check = () => {
        if (hasReachedLayout) {
          resolve();
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });

    expect(invocations.length).toBe(6);
    expect(invocations[0]).toBe('component');
    expect(invocations[1]).toBe('stackBottom');
    expect(invocations[2]).toBe('column');
    expect(invocations[3]).toBe('stackTop');
    expect(invocations[4]).toBe('root');
    expect(invocations[5]).toBe('layout');
  });

  it('stops propagation', async () => {
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

    const invocations: string[] = [];
    const eventName = 'eventB';

    layout.root.contentItems[0].contentItems[0].contentItems[0].contentItems[0].on(
      eventName,
      () => {
        invocations.push('component');
      }
    );

    layout.root.contentItems[0].contentItems[0].contentItems[0].on(
      eventName,
      () => {
        invocations.push('stackBottom');
      }
    );

    layout.root.contentItems[0].contentItems[0].on(
      eventName,
      (event: BubblingEvent) => {
        event.stopPropagation();
        invocations.push('column');
      }
    );

    layout.root.contentItems[0].on(eventName, () => {
      invocations.push('stackTop');
    });

    layout.root.on(eventName, () => {
      invocations.push('root');
    });

    layout.on(eventName, () => {
      invocations.push('layout');
    });

    layout.root.getItemsByType('component')[0].emitBubblingEvent(eventName);

    expect(invocations.length).toBe(3);
    expect(invocations[0]).toBe('component');
    expect(invocations[1]).toBe('stackBottom');
    expect(invocations[2]).toBe('column');
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
