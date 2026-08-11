import React from 'react';
import { render, act } from '@testing-library/react';
import Popper from './Popper';

// Marker wrapper so containPortals wrapping is observable in the DOM
// (the real provider renders no DOM of its own).
jest.mock('react-aria', () => ({
  ...jest.requireActual('react-aria'),
  UNSAFE_PortalProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="portal-provider">{children}</div>
  ),
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

/**
 * Renders a `Popper`, then flips `isShown` to true and flushes the
 * requestAnimationFrame/transition work so the portaled content is present in
 * the DOM.
 */
function renderShown(extraProps: Record<string, unknown> = {}) {
  const child = <div data-testid="popper-child">content</div>;
  const result = render(
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Popper isShown={false} {...extraProps}>
      {child}
    </Popper>
  );
  act(() => {
    result.rerender(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Popper isShown {...extraProps}>
        {child}
      </Popper>
    );
  });
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  return result;
}

it('renders its children when shown', () => {
  renderShown();
  expect(document.body.querySelector('[data-testid="popper-child"]')).not.toBe(
    null
  );
});

it('does not wrap children in a portal provider by default', () => {
  renderShown();
  expect(
    document.body.querySelector('[data-testid="portal-provider"]')
  ).toBeNull();
  // Children still render regardless.
  expect(
    document.body.querySelector('[data-testid="popper-child"]')
  ).not.toBeNull();
});

it('wraps children in a portal provider when containPortals is true', () => {
  renderShown({ containPortals: true });
  const provider = document.body.querySelector(
    '[data-testid="portal-provider"]'
  );
  expect(provider).not.toBeNull();
  // The child renders inside the portal provider wrapper.
  expect(
    provider?.querySelector('[data-testid="popper-child"]')
  ).not.toBeNull();
});

it('does not isolate popper-content by default', () => {
  renderShown();
  const content = document.body.querySelector('.popper-content');
  expect(content).not.toBeNull();
  expect(content?.classList.contains('popper-content--contain-portals')).toBe(
    false
  );
});

it('isolates popper-content when containPortals is true', () => {
  renderShown({ containPortals: true });
  const content = document.body.querySelector('.popper-content');
  expect(content).not.toBeNull();
  expect(content?.classList.contains('popper-content--contain-portals')).toBe(
    true
  );
});
