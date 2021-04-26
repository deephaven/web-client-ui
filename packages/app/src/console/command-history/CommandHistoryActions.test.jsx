import React from 'react';
import { mount } from 'enzyme';
import CommandHistoryActions from './CommandHistoryActions';

jest.useFakeTimers();

const makeHistoryActionsMock = () => [
  {
    title: 'Primary action title',
    description: 'Primary action description',
    action: jest.fn(),
  },
  {
    title: 'Secondary action title',
    description: 'Secondary action description',
    action: jest.fn(),
  },
];

function mountHistoryActions(actions) {
  return mount(<CommandHistoryActions actions={actions} hasSelection />);
}

it('renders a button for each action', () => {
  const historyActions = makeHistoryActionsMock();
  const wrapper = mountHistoryActions(historyActions);

  jest.runAllTimers();
  wrapper.update();

  for (let i = 0; i < historyActions.length; i += 1) {
    expect(wrapper.find('button').at(i).length).toBe(1);
  }
});

it('calls action callback on button click', () => {
  const historyActions = makeHistoryActionsMock();
  const wrapper = mountHistoryActions(historyActions);
  const buttonIndexToClick = 0;

  jest.runAllTimers();
  wrapper.update();

  expect(historyActions[buttonIndexToClick].action.mock.calls.length).toBe(0);

  wrapper.find('button').at(buttonIndexToClick).simulate('click');

  expect(historyActions[buttonIndexToClick].action.mock.calls.length).toBe(1);
});
