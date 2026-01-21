import $ from 'jquery';
import LayoutManager from '../LayoutManager';
import type { ItemContainer } from '../container';
import type { InputConfig } from '../config';
import {
  cleanupLayout,
  verifyPath,
  waitForLayoutInit,
} from '../test-utils/testUtils';

class SimpleTestComponent {
  constructor(cont: ItemContainer) {
    cont.getElement().html('that worked');
  }
}

describe('Can initialise the layoutmanager', () => {
  let myLayout: LayoutManager | null = null;

  afterEach(() => {
    cleanupLayout(myLayout);
    myLayout = null;
  });

  const simpleConfig: InputConfig = {
    content: [
      {
        type: 'component',
        componentName: 'testComponent',
      },
    ],
  };

  const createTestLayout = (config: InputConfig): LayoutManager => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    const layout = new LayoutManager(config, container);
    layout.registerComponent('testComponent', SimpleTestComponent);
    return layout;
  };

  it('Finds the layoutmanager on the global namespace', () => {
    expect(LayoutManager).toBeDefined();
  });

  it('Can create a most basic layout', async () => {
    myLayout = createTestLayout(simpleConfig);
    myLayout.init();
    await waitForLayoutInit(myLayout);

    expect($('.lm_goldenlayout').length).toBe(1);
    verifyPath('stack.0.component', myLayout);
  });
});
