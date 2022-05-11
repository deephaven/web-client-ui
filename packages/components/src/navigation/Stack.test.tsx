import React from 'react';
import { act } from 'react-dom/test-utils';
import { render, screen } from '@testing-library/react';
import Stack from './Stack';

// Mock the CSS transitions to appear right away, and call the entered animation after a timeout
jest.mock('react-transition-group', () => ({
  CSSTransition: jest.fn(props => {
    if (!props.in) {
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
  let rerenderFxn;

  function renderStack(stackCount: number, itemCount = 5) {
    texts = makeStackItemTexts(itemCount);
    stackItems = texts.map(makeStackItem);
    const { rerender } = render(
      <Stack>{stackItems.slice(0, stackCount)}</Stack>
    );
    rerenderFxn = rerender;
  }

  function updateStack(stackCount: number) {
    rerenderFxn(<Stack>{stackItems.slice(0, stackCount)}</Stack>);
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
