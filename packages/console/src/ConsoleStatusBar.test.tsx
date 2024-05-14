import React from 'react';
import { render, screen } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import { ContextActions, DropdownActions } from '@deephaven/components';
import { vsCheck } from '@deephaven/icons';
import { TestUtils } from '@deephaven/utils';
import userEvent from '@testing-library/user-event';
import ConsoleStatusBar from './ConsoleStatusBar';

jest.useFakeTimers();

function makeConsoleStatusBarWrapper(actions: DropdownActions = []) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession('test');
  const wrapper = render(
    <ConsoleStatusBar dh={dh} session={session} overflowActions={actions} />
  );

  return wrapper;
}

beforeEach(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
    cb(0);
    return 1;
  });
});

afterEach(() => {
  TestUtils.asMock(window.requestAnimationFrame).mockRestore();
});

it('renders without crashing', () => {
  makeConsoleStatusBarWrapper();
});

it('does not show a dropdown menu when there are no actions', async () => {
  makeConsoleStatusBarWrapper();
  expect(screen.queryByRole('button', { name: 'More Actions...' })).toBeNull();
});

it('dropdown menu disappears on toggle', async () => {
  const user = userEvent.setup({ delay: null });
  const mockClick = jest.fn();
  const title = 'action';
  makeConsoleStatusBarWrapper(() => [
    {
      title,
      action: mockClick,
      group: ContextActions.groups.high,
      icon: vsCheck,
      order: 10,
    },
  ]);
  const button = screen.getByRole('button', { name: 'More Actions...' });
  await user.click(button);
  let dropdown: HTMLElement | null = screen.getByText(title);
  expect(dropdown).toBeTruthy();
  await user.click(dropdown);
  expect(mockClick).toBeCalled();
  jest.runAllTimers();
  dropdown = screen.queryByText(title);
  expect(dropdown).toBeFalsy();
});
