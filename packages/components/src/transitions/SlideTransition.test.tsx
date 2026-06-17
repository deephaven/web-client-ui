import React from 'react';
import { act, render } from '@testing-library/react';
import SlideTransition from './SlideTransition';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

it('renders its children', () => {
  const { getByTestId } = render(
    <SlideTransition in>
      <div data-testid="child">content</div>
    </SlideTransition>
  );

  expect(getByTestId('child')).toBeTruthy();
});

it('points the transition ref at the first child element, applying slide classes to it', () => {
  // The child only exists while `in` is true, mimicking how `Stack` renders the
  // popping/pushing view conditionally. Re-reading `firstElementChild` when
  // `in` toggles is what lets CSSTransition animate the child once it appears.
  function Wrapper({ on }: { on: boolean }): JSX.Element {
    return (
      <SlideTransition in={on} direction="left">
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <>{on && <div data-testid="child">content</div>}</>
      </SlideTransition>
    );
  }

  const { rerender, queryByTestId, getByTestId } = render(
    <Wrapper on={false} />
  );
  // Child is not rendered while `in` is false.
  expect(queryByTestId('child')).toBeNull();

  act(() => {
    rerender(<Wrapper on />);
  });

  // The newly-appeared child receives the slide transition classes, proving the
  // ref was re-attached to `firstElementChild` when `in` toggled.
  const child = getByTestId('child');
  expect(child.className).toContain('slide-left');
});

it('applies the slide-right class when direction is right', () => {
  // CSSTransition only adds enter classes when `in` transitions to true, so we
  // toggle `in` to trigger the animation rather than mounting with `in` true.
  function Wrapper({ on }: { on: boolean }): JSX.Element {
    return (
      <SlideTransition in={on} direction="right">
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <>{on && <div data-testid="child">content</div>}</>
      </SlideTransition>
    );
  }

  const { rerender, getByTestId } = render(<Wrapper on={false} />);

  act(() => {
    rerender(<Wrapper on />);
  });

  expect(getByTestId('child').className).toContain('slide-right');
});

it('unmounts cleanly, detaching the ref', () => {
  const { unmount } = render(
    <SlideTransition in>
      <div data-testid="child">content</div>
    </SlideTransition>
  );

  // Unmounting invokes the ref callback with `null`.
  expect(() => unmount()).not.toThrow();
});
