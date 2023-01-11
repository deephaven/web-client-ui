import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommandHistoryActions from './CommandHistoryActions';

jest.useFakeTimers();

const toBeClicked = jest.fn();
const makeHistoryActionsMock = () => [
  {
    title: 'Primary action title',
    description: 'Primary action description',
    action: toBeClicked,
  },
  {
    title: 'Secondary action title',
    description: 'Secondary action description',
    action: jest.fn(),
  },
];

function mountHistoryActions(actions) {
  return render(<CommandHistoryActions actions={actions} hasSelection />);
}

it('renders a button for each action', () => {
  const historyActions = makeHistoryActionsMock();
  mountHistoryActions(historyActions);

  jest.runAllTimers();

  expect(screen.getAllByRole('button').length).toBe(historyActions.length);
});

it('calls action callback on button click', async () => {
  const user = userEvent.setup({ delay: null });
  const historyActions = makeHistoryActionsMock();
  mountHistoryActions(historyActions);
  const buttonIndexToClick = 0;

  jest.runAllTimers();

  const button = screen.getAllByRole('button')[buttonIndexToClick];
  expect(toBeClicked).toHaveBeenCalledTimes(0);
  await user.click(button);
  expect(toBeClicked).toHaveBeenCalledTimes(1);
});
