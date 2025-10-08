import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TestUtils } from '@deephaven/test-utils';
import ContextActions from './ContextActions';
import ContextActionUtils from './ContextActionUtils';
import ContextMenuRoot from './ContextMenuRoot';

const TEST_MENU_1 = [
  { title: 'Test1' },
  { title: 'Test2' },
  { title: 'Test3' },
];

it('renders without crashing', async () => {
  render(
    <>
      <ContextActions actions={TEST_MENU_1} />
      <ContextMenuRoot />
    </>
  );
});

it('handles the context menu event on the parent, renders an array of menu items', async () => {
  const user = userEvent.setup();

  const menu = render(
    <>
      <ContextActions actions={TEST_MENU_1} />
      <ContextMenuRoot />
    </>
  );

  expect(menu.queryAllByRole('button').length).toBe(0);
  await TestUtils.rightClick(user, menu.container);
  expect(menu.queryAllByRole('button').length).toBe(TEST_MENU_1.length);
});

it('renders a promise returning menu items properly', async () => {
  const user = userEvent.setup();
  const promise = Promise.resolve(TEST_MENU_1);
  const menu = render(
    <>
      <ContextActions actions={[...TEST_MENU_1, promise]} />
      <ContextMenuRoot />
    </>
  );

  expect(menu.queryAllByRole('button').length).toBe(0);
  await TestUtils.rightClick(user, menu.container);
  expect(menu.queryAllByRole('button').length).toBe(TEST_MENU_1.length * 2);
});

it('renders an empty menu for a rejected promise', async () => {
  const user = userEvent.setup();
  const promise = () => Promise.reject();
  const menu = render(
    <>
      <ContextActions actions={[...TEST_MENU_1, promise]} />
      <ContextMenuRoot />
    </>
  );

  await TestUtils.rightClick(user, menu.container);

  expect(menu.queryAllByRole('button').length).toBe(TEST_MENU_1.length);
});

it('renders a menu from a promise returned from a function', async () => {
  const user = userEvent.setup();
  const promise = Promise.resolve(TEST_MENU_1);
  const menu = render(
    <>
      <ContextActions actions={() => promise} />
      <ContextMenuRoot />
    </>
  );

  expect(menu.queryAllByRole('button').length).toBe(0);
  await TestUtils.rightClick(user, menu.container);
  expect(menu.queryAllByRole('button').length).toBe(TEST_MENU_1.length);
});

it('sorts by title properly', () => {
  const actions = [{ title: 'b' }, { title: 'c' }, { title: 'a' }];
  const expectedResult = [actions[2], actions[0], actions[1]];
  const sortedActions = ContextActionUtils.sortActions(actions);
  expect(sortedActions).toEqual(expectedResult);
});

it('sorts by order properly', () => {
  const actions = [
    { title: 'c', order: 40 },
    { title: 'b', order: 90 },
    { title: 'a', order: 10 },
  ];
  const expectedResult = [actions[2], actions[0], actions[1]];
  const sortedActions = ContextActionUtils.sortActions(actions);
  expect(sortedActions).toEqual(expectedResult);
});

it('sorts groups properly', () => {
  const actions = [
    { title: 'c', order: 40, group: 10 },
    { title: 'b', order: 90, group: 10 },
    { title: 'a', order: 10, group: 30 },
  ];
  const expectedResult = [actions[0], actions[1], actions[2]];
  const sortedActions = ContextActionUtils.sortActions(actions);
  expect(sortedActions).toEqual(expectedResult);
});

it('sorts mixed groups properly', () => {
  const actions = [
    { title: 'c', order: 40, group: 10 },
    { title: 'a', order: 10 },
    { title: 'b', order: 90, group: 10 },
  ];
  const expectedResult = [actions[1], actions[0], actions[2]];
  const sortedActions = ContextActionUtils.sortActions(actions);
  expect(sortedActions).toEqual(expectedResult);
});

it('sorts groups/orders properly', () => {
  const actions = [
    { title: 'c', order: 104, group: 1 },
    { order: 10, group: 1 },
    { title: 'b', order: 105, group: 1 },
  ];
  const expectedResult = [actions[1], actions[0], actions[2]];
  const sortedActions = ContextActionUtils.sortActions(actions);
  expect(sortedActions).toEqual(expectedResult);
});
