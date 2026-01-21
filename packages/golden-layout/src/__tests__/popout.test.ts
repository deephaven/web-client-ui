import LayoutManager from '../LayoutManager';
import { createLayout, cleanupLayout } from '../test-utils/testUtils';

describe('it can popout components into browserwindows', () => {
  let layout: LayoutManager | null = null;

  // Mock window.open for popout tests
  const mockPopoutWindow = {
    closed: false,
    close: jest.fn(),
    focus: jest.fn(),
    document: {
      write: jest.fn(),
      close: jest.fn(),
      body: document.createElement('body'),
      head: document.createElement('head'),
      title: '',
      readyState: 'complete',
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    location: { href: '' },
    opener: window,
  };

  beforeEach(() => {
    jest
      .spyOn(window, 'open')
      .mockReturnValue(mockPopoutWindow as unknown as Window);
    mockPopoutWindow.closed = false;
  });

  afterEach(() => {
    cleanupLayout(layout);
    layout = null;
    jest.restoreAllMocks();
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
              id: 'componentA',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'componentB',
            },
          ],
        },
      ],
    });

    expect(layout.isInitialised).toBe(true);
  });

  it('opens testComponent in a new window', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'componentA',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'componentB',
            },
          ],
        },
      ],
    });

    expect(layout.openPopouts.length).toBe(0);
    const component = layout.root.getItemsById('componentA')[0];
    const browserPopout = component.popout();

    expect(browserPopout!.getWindow()!.closed).toBe(false);
    expect(layout.openPopouts.length).toBe(1);
  });

  /**
   * This test was skipped in the original Karma tests because karma injects
   * stuff into the new window which throws errors before GoldenLayout can
   * initialise. With proper mocking, we attempt to enable it.
   */
  it.skip('serialises the new window', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'componentA',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'componentB',
            },
          ],
        },
      ],
    });

    const component = layout.root.getItemsById('componentA')[0];
    component.popout();

    expect(layout.openPopouts.length).toBe(1);

    // Wait for popout to initialize
    await new Promise<void>(resolve => {
      const check = () => {
        if (layout!.openPopouts[0].isInitialised) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });

    const config = layout.toConfig();
    expect(config.openPopouts?.length).toBe(1);
    expect(typeof config.openPopouts?.[0].dimensions.left).toBe('number');
    expect(typeof config.openPopouts?.[0].dimensions.top).toBe('number');
    expect((config.openPopouts?.[0].dimensions.width ?? 0) > 0).toBe(true);
    expect((config.openPopouts?.[0].dimensions.height ?? 0) > 0).toBe(true);
    expect(config.openPopouts?.[0].content[0].type).toBe('component');
  });

  /**
   * This test was skipped in the original Karma tests.
   */
  it.skip('closes the open window', async () => {
    layout = await createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'componentA',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'componentB',
            },
          ],
        },
      ],
    });

    const component = layout.root.getItemsById('componentA')[0];
    const browserPopout = component.popout();

    browserPopout!.close();

    // Wait for window to close
    await new Promise<void>(resolve => {
      const check = () => {
        if (
          browserPopout!.getWindow()!.closed &&
          layout!.openPopouts.length === 0
        ) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      mockPopoutWindow.closed = true;
      check();
    });
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
