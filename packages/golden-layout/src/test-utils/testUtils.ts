import type { PartialConfig } from '../config';
import type { ItemContainer } from '../container';
import LayoutManager from '../LayoutManager';

/**
 * Test component used in layout tests.
 * Mimics the behavior of the original testTools.TestComponent.
 */
export class TestComponent {
  isTestComponentInstance = true;

  constructor(container: ItemContainer, state?: unknown) {
    const htmlState = state as { html?: string } | undefined;
    if (htmlState === undefined) {
      container.getElement().html('that worked');
    } else {
      container.getElement().html(htmlState.html ?? '');
    }
  }
}

/**
 * Creates a layout with the given configuration and waits for it to initialize.
 * @param config The layout configuration
 * @returns A promise that resolves to the initialized layout
 */
export async function createLayout(
  config: PartialConfig
): Promise<LayoutManager> {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  document.body.appendChild(container);

  const layout = new LayoutManager(config, container);
  layout.registerComponent('testComponent', TestComponent);
  layout.init();

  await waitForLayoutInit(layout);
  return layout;
}

/**
 * Waits for a layout to be initialized.
 * @param layout The layout to wait for
 * @param timeout Optional timeout in milliseconds (default: 5000)
 */
export async function waitForLayoutInit(
  layout: LayoutManager,
  timeout = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (layout.isInitialised) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Layout initialization timeout'));
    }, timeout);

    layout.on('initialised', () => {
      clearTimeout(timeoutId);
      resolve();
    });
  });
}

/**
 * Takes a path of type.index.type.index, e.g.
 * 'row.0.stack.1.component'
 * and resolves it to an element.
 *
 * @param path The path string
 * @param layout The layout instance
 * @returns The content item at the path, or null if not found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function verifyPath(path: string, layout: LayoutManager): any | null {
  expect(layout.root).toBeDefined();
  expect(layout.root.contentItems.length).toBe(1);

  const pathSegments = path.split('.');
  let node = layout.root.contentItems[0];

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    if (isNaN(Number(segment))) {
      expect(node.type).toBe(segment);
    } else {
      node = node.contentItems[parseInt(segment, 10)];
      expect(node).toBeDefined();
      if (node === undefined) {
        return null;
      }
    }
  }

  return node;
}

/**
 * Cleans up the layout and DOM after a test.
 * Verifies that destruction succeeds when the layout was initialized and not already destroyed.
 * @param layout The layout to destroy
 */
export function cleanupLayout(layout: LayoutManager | null | undefined): void {
  if (layout?.isInitialised && layout.root.contentItems.length > 0) {
    // Layout is initialized and has content - destroy it and verify
    layout.destroy();
    expect(layout.root.contentItems.length).toBe(0);
  }
  // Clear all layout containers from body
  document.body.innerHTML = '';
}
