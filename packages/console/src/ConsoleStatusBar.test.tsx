import React from 'react';
import { render, screen } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import { ContextActions, DropdownAction } from '@deephaven/components';
import { vsCheck } from '@deephaven/icons';
import userEvent, { TargetElement } from '@testing-library/user-event';
import ConsoleStatusBar from './ConsoleStatusBar';

jest.useFakeTimers();

function makeConsoleStatusBarWrapper(
  overflowActions: () => DropdownAction[] = () => []
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession('test');
  const wrapper = render(
    <ConsoleStatusBar
      session={session}
      openObject={() => undefined}
      objects={[]}
      overflowActions={overflowActions}
    />
  );

  return wrapper;
}

beforeEach(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb());
});

afterEach(() => {
  window.requestAnimationFrame.mockRestore();
});

it('renders without crashing', () => {
  makeConsoleStatusBarWrapper();
});

it('dropdown menu disappears on toggle', () => {
  const mockClick = jest.fn();
  makeConsoleStatusBarWrapper(() => [
    {
      title: 'test item',
      action: mockClick,
      group: ContextActions.groups.high,
      icon: vsCheck,
      order: 10,
    },
  ]);
  const button = document.querySelector(
    '.btn-overflow.btn-link-icon'
  ) as TargetElement;
  userEvent.click(button);
  let dropdown: HTMLElement | null = screen.getByText('test item');
  expect(dropdown).toBeTruthy();
  userEvent.click(dropdown);
  expect(mockClick).toBeCalled();
  jest.runAllTimers();
  dropdown = screen.queryByText('test item');
  expect(dropdown).toBeFalsy();
});
