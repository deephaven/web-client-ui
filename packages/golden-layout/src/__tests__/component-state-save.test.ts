import LayoutManager from '../LayoutManager';
import type { ItemContainer } from '../container';
import type { StackItemConfig, ComponentConfig, PartialConfig } from '../config';
import { cleanupLayout, waitForLayoutInit } from '../test-utils/testUtils';

interface TestState {
  testValue: string;
}

interface TestComponentRef {
  container: ItemContainer;
  state: TestState;
}

describe("Sets and retrieves a component's state", () => {
  let myLayout: LayoutManager | null = null;
  let myComponent: TestComponentRef | null = null;

  afterEach(() => {
    cleanupLayout(myLayout);
    myLayout = null;
    myComponent = null;
  });

  const statefulConfig: PartialConfig = {
    content: [
      {
        type: 'component',
        componentName: 'testComponent',
        componentState: { testValue: 'initial' },
      },
    ],
  };

  // Factory that creates a component class capturing the ref
  const createStatefulComponent = () =>
    class StatefulComponent {
      constructor(container: ItemContainer, state: unknown) {
        myComponent = {
          container,
          state: state as TestState,
        };
      }
    };

  const createTestLayout = (
    config: PartialConfig,
    component: new (cont: ItemContainer, state?: unknown) => unknown
  ): LayoutManager => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    const newLayout = new LayoutManager(config, container);
    newLayout.registerComponent('testComponent', component);
    return newLayout;
  };

  const initLayout = async (layout: LayoutManager): Promise<void> => {
    layout.init();
    await waitForLayoutInit(layout);
  };

  const getComponentState = (layout: LayoutManager): TestState => {
    const config = layout.toConfig();
    const stack = config.content[0] as StackItemConfig;
    const component = stack.content![0] as ComponentConfig;
    return component.componentState as unknown as TestState;
  };

  it('Can create a most basic layout', async () => {
    myLayout = createTestLayout(statefulConfig, createStatefulComponent());
    await initLayout(myLayout);

    expect(myComponent!.state.testValue).toBe('initial');
  });

  it('returns the initial state', async () => {
    myLayout = createTestLayout(statefulConfig, createStatefulComponent());
    await initLayout(myLayout);

    expect(getComponentState(myLayout).testValue).toBe('initial');
  });

  it('emits stateChanged when a component updates its state', async () => {
    myLayout = createTestLayout(statefulConfig, createStatefulComponent());
    await initLayout(myLayout);

    let stateChanges = 0;
    myLayout.on('stateChanged', () => {
      stateChanges++;
    });

    myComponent!.container.setState({ testValue: 'updated' });

    // Wait for next animation frame (stateChanged is throttled via animFrame)
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    expect(stateChanges).toBe(1);
  });

  it('returns the updated state', async () => {
    myLayout = createTestLayout(statefulConfig, createStatefulComponent());
    await initLayout(myLayout);

    myComponent!.container.setState({ testValue: 'updated' });

    // Wait for next animation frame (stateChanged is throttled via animFrame)
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    expect(getComponentState(myLayout).testValue).toBe('updated');
  });
});
