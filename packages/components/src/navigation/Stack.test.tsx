import React from 'react';
import { act, render, screen } from '@testing-library/react';
import Stack from './Stack';

// Mock the CSS transitions to appear right away, and call the entered animation after a timeout
jest.mock('../transitions', () => ({
  SlideTransition: jest.fn(props => {
    if (props.in === false) {
      return null;
    }

    setTimeout(props.onEntered, 50);

    return props.children;
  }),
}));

function makeStackItemText(index: number) {
  return `stack-text-${index}`;
}

function makeStackItemTexts(count = 3) {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    items.push(makeStackItemText(i));
  }

  return items;
}

function makeStackItem(text: string) {
  return (
    <div className={text} key={text}>
      {text}
    </div>
  );
}

beforeAll(() => {
  jest.useFakeTimers();
});

describe('stack push and pop tests', () => {
  let texts: string[];
  let stackItems: React.ReactNode[];
  let rerender: (ui: React.ReactElement) => void;

  function renderStack(stackCount: number, itemCount = 5) {
    texts = makeStackItemTexts(itemCount);
    stackItems = texts.map(makeStackItem);
    ({ rerender } = render(<Stack>{stackItems.slice(0, stackCount)}</Stack>));
  }

  function updateStack(stackCount: number) {
    rerender(<Stack>{stackItems.slice(0, stackCount)}</Stack>);
  }

  function runTimers() {
    // Since the state changes when we run timers, we need to wrap in act
    act(() => {
      jest.runOnlyPendingTimers();
    });
  }

  /**
   * Check if an item is rendered in the stack
   * @param i The index of the item to expect
   */
  function expectItem(i: number, isVisible: boolean) {
    expect(screen.queryAllByText(`stack-text-${i}`).length).toBe(
      isVisible ? 1 : 0
    );
  }

  /**
   * Checks the stack items visibility
   * @param visibleItems The items that are visible
   */
  function expectStack(visibleItems: number[]) {
    for (let i = 0; i < stackItems.length; i += 1) {
      expectItem(i, visibleItems.indexOf(i) >= 0);
    }
  }
  it('mounts and unmounts', async () => {
    renderStack(1, 3);
  });

  it('pushes items when stack grows', async () => {
    renderStack(1, 3);
    expectStack([0]);

    updateStack(2);
    expectStack([0, 1]);

    runTimers();
    expectStack([1]);

    updateStack(3);
    expectStack([1, 2]);

    runTimers();
    expectStack([2]);
  });

  it('pops items when stack shrinks', async () => {
    renderStack(3, 3);
    expectStack([2]);

    updateStack(2);
    expectStack([1, 2]);

    runTimers();
    expectStack([1]);

    updateStack(1);
    expectStack([0, 1]);

    runTimers();
    expectStack([0]);
  });

  it('pops multiple items', async () => {
    renderStack(5, 5);
    expectStack([4]);

    updateStack(1);
    expectStack([0, 4]);

    runTimers();
    expectStack([0]);
  });
});

describe('key-based view tracking', () => {
  function runTimers() {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  }

  /** Builds a stack item identified by `key` but with arbitrary content. */
  function keyedItem(key: string, content: string) {
    return (
      <div key={key} className={key}>
        {content}
      </div>
    );
  }

  it('keeps content live when re-rendered with new props for the same key', () => {
    // The element instance changes but the key does not - this mimics a parent
    // (e.g. IrisGrid) re-rendering with fresh children for the same logical
    // view. The rendered view should reflect the latest props, and no slide
    // animation should be triggered.
    const { rerender } = render(<Stack>{[keyedItem('a', 'v1')]}</Stack>);
    expect(screen.getByText('v1')).toBeTruthy();

    rerender(<Stack>{[keyedItem('a', 'v2')]}</Stack>);

    expect(screen.getByText('v2')).toBeTruthy();
    expect(screen.queryByText('v1')).toBeNull();
    // No push/pop animation should have started.
    expect(document.querySelector('.pushing-view')).toBeNull();
    expect(document.querySelector('.popping-view')).toBeNull();
  });

  it('does not churn or remount when repeatedly re-rendered with new instances for the same keys', () => {
    // Regression: a host (e.g. IrisGrid) re-renders frequently, handing the
    // stack brand-new element objects that represent the same logical views.
    // Tracking by `key` means these re-renders must not trigger a push/pop
    // animation, and the mounted view must stay mounted (same DOM node).
    const { rerender } = render(
      <Stack>{[keyedItem('a', 'A'), keyedItem('b', 'B')]}</Stack>
    );
    const mountedView = screen.getByText('B');

    for (let i = 0; i < 5; i += 1) {
      // Fresh element instances, identical keys.
      rerender(<Stack>{[keyedItem('a', 'A'), keyedItem('b', 'B')]}</Stack>);

      // The same DOM node remains mounted - it was never unmounted/remounted.
      expect(screen.getByText('B')).toBe(mountedView);
      // No slide animation was triggered by the re-render.
      expect(document.querySelector('.pushing-view')).toBeNull();
      expect(document.querySelector('.popping-view')).toBeNull();
    }

    // Running any timers must not flush a pending animation - there is none.
    runTimers();
    expect(screen.getByText('B')).toBe(mountedView);
    expect(screen.queryByText('A')).toBeNull();
  });

  it('does not retrigger the push animation when re-rendered mid-push with the same top key', () => {
    const { rerender } = render(<Stack>{[keyedItem('a', 'A')]}</Stack>);
    rerender(<Stack>{[keyedItem('a', 'A'), keyedItem('b', 'B')]}</Stack>);
    // Mid-push: main 'A' plus pushing 'B'.
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();

    // Re-render with brand-new element instances for the same keys/length.
    rerender(<Stack>{[keyedItem('a', 'A'), keyedItem('b', 'B')]}</Stack>);
    // Still mid-push to the same view - nothing changes.
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();

    runTimers();
    // Push completes - 'B' becomes the main view.
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.queryByText('A')).toBeNull();
  });

  it('redirects the push to a new view when a different view is pushed mid-push', () => {
    const { rerender } = render(<Stack>{[keyedItem('a', 'A')]}</Stack>);
    rerender(<Stack>{[keyedItem('a', 'A'), keyedItem('b', 'B')]}</Stack>);
    expect(screen.getByText('B')).toBeTruthy();

    // Push a third view before the first push completes.
    rerender(
      <Stack>
        {[keyedItem('a', 'A'), keyedItem('b', 'B'), keyedItem('c', 'C')]}
      </Stack>
    );
    // The push now targets 'C' instead of 'B'.
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('C')).toBeTruthy();
    expect(screen.queryByText('B')).toBeNull();

    runTimers();
    expect(screen.getByText('C')).toBeTruthy();
  });

  it('redirects the main view when the top changes mid-pop', () => {
    const { rerender } = render(
      <Stack>{[keyedItem('a', 'A'), keyedItem('b', 'B')]}</Stack>
    );
    expect(screen.getByText('B')).toBeTruthy();

    // Pop down to 'A' - starts the pop animation for 'B'.
    rerender(<Stack>{[keyedItem('a', 'A')]}</Stack>);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();

    // While 'B' is still popping out, swap the remaining view to 'C'.
    rerender(<Stack>{[keyedItem('c', 'C')]}</Stack>);
    expect(screen.getByText('C')).toBeTruthy();
    expect(screen.queryByText('A')).toBeNull();
    // 'B' is still animating out.
    expect(screen.getByText('B')).toBeTruthy();

    runTimers();
    expect(screen.getByText('C')).toBeTruthy();
    expect(screen.queryByText('B')).toBeNull();
  });

  it('does not churn the main view when re-rendered mid-pop with the same remaining view', () => {
    const { rerender } = render(
      <Stack>{[keyedItem('a', 'A'), keyedItem('b', 'B')]}</Stack>
    );

    // Pop down to 'A' - starts the pop animation for 'B'.
    rerender(<Stack>{[keyedItem('a', 'A')]}</Stack>);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();

    // Re-render mid-pop with a new element instance for the same key 'A'.
    // The top key is unchanged, so the main view is left untouched.
    rerender(<Stack>{[keyedItem('a', 'A2')]}</Stack>);
    expect(screen.getByText('A2')).toBeTruthy();
    // 'B' is still animating out.
    expect(screen.getByText('B')).toBeTruthy();

    runTimers();
    expect(screen.getByText('A2')).toBeTruthy();
    expect(screen.queryByText('B')).toBeNull();
  });

  it('swaps the main view without animating when the top key changes at the same depth', () => {
    // Same stack length but a different top key - the main view is replaced
    // directly, with no push/pop animation.
    const { rerender } = render(<Stack>{[keyedItem('a', 'A')]}</Stack>);
    expect(screen.getByText('A')).toBeTruthy();

    rerender(<Stack>{[keyedItem('b', 'B')]}</Stack>);
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.queryByText('A')).toBeNull();
    expect(document.querySelector('.pushing-view')).toBeNull();
    expect(document.querySelector('.popping-view')).toBeNull();
  });

  it('renders nothing when there are no children', () => {
    const { container } = render(<Stack>{[]}</Stack>);
    const mainView = container.querySelector('.main-view');
    expect(mainView).not.toBeNull();
    expect(mainView).toBeEmptyDOMElement();
    expect(document.querySelector('.pushing-view')).toBeNull();
    expect(document.querySelector('.popping-view')).toBeNull();
  });
});
