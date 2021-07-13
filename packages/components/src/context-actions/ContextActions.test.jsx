import React from 'react';
import TestRenderer from 'react-test-renderer';
import { TestUtils } from '@deephaven/utils';
import { ContextMenuRoot, ContextActionUtils } from '.';

jest.mock('react-transition-group', () => ({
  CSSTransition: 'cssTransition',
  TransitionGroup: 'transitionGroup',
}));

const TEST_MENU_1 = [
  { title: 'Test1' },
  { title: 'Test2' },
  { title: 'Test3' },
];

function contextMenuMock(mock, element) {
  if (element.props && element.props.className) {
    if (element.props.className.indexOf('context-menu') !== -1) {
      return mock;
    }
  }

  return null;
}

function DEFAULT_MOCK(mockParent = true) {
  return {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    })),
    focus: jest.fn(),
    offsetParent: mockParent ? DEFAULT_MOCK(false) : null,
    parentElement: mockParent ? DEFAULT_MOCK(false) : null,
    setAttribute: jest.fn(),
  };
}

it('renders without crashing', () => {
  const mock = DEFAULT_MOCK();

  const tree = TestRenderer.create(
    <div>
      <ContextMenuRoot />
    </div>,
    {
      createNodeMock: contextMenuMock.bind(this, mock),
    }
  );

  expect(mock.parentElement.addEventListener.mock.calls.length).toBe(1);
  expect(mock.parentElement.addEventListener.mock.calls[0][0]).toBe(
    'contextmenu'
  );
  expect(mock.parentElement.addEventListener.mock.calls[0][1]).not.toBeNull();
  expect(mock.parentElement.removeEventListener.mock.calls.length).toBe(0);

  expect(tree).toMatchSnapshot();

  tree.unmount();

  expect(mock.parentElement.addEventListener.mock.calls.length).toBe(1);
  expect(mock.parentElement.removeEventListener.mock.calls.length).toBe(1);
});

it('handles the context menu event on the parent, renders an array of menu items', () => {
  const mock = DEFAULT_MOCK();

  const tree = TestRenderer.create(
    <div>
      <ContextMenuRoot />
    </div>,
    {
      createNodeMock: contextMenuMock.bind(this, mock),
    }
  );

  expect(mock.parentElement.addEventListener.mock.calls.length).toBe(1);
  expect(mock.parentElement.addEventListener.mock.calls[0][0]).toBe(
    'contextmenu'
  );
  expect(mock.parentElement.addEventListener.mock.calls[0][1]).not.toBeNull();
  expect(mock.parentElement.removeEventListener.mock.calls.length).toBe(0);

  expect(tree.root.findAllByType('button').length).toBe(0);

  expect(tree).toMatchSnapshot();

  const mockEvent = { preventDefault: jest.fn(), contextActions: TEST_MENU_1 };
  const handleContextMenu =
    mock.parentElement.addEventListener.mock.calls[0][1];
  handleContextMenu(mockEvent);

  expect(tree.root.findAllByType('button').length).toBe(TEST_MENU_1.length);

  tree.unmount();

  expect(mock.parentElement.addEventListener.mock.calls.length).toBe(1);
  expect(mock.parentElement.removeEventListener.mock.calls.length).toBe(1);
});

it('renders a promise returning menu items properly', async () => {
  const mock = DEFAULT_MOCK();
  const promise = Promise.resolve(TEST_MENU_1);

  const tree = TestRenderer.create(
    <div>
      <ContextMenuRoot />
    </div>,
    {
      createNodeMock: contextMenuMock.bind(this, mock),
    }
  );

  const mockEvent = { preventDefault: jest.fn(), contextActions: [promise] };
  const handleContextMenu =
    mock.parentElement.addEventListener.mock.calls[0][1];
  handleContextMenu(mockEvent);
  await TestUtils.flushPromises();

  expect(tree.root.findAllByType('button').length).toBe(TEST_MENU_1.length);
  expect(tree).toMatchSnapshot();
});

it('renders an empty menu for a rejected promise', () => {
  const mock = DEFAULT_MOCK();
  const promise = Promise.reject();

  const tree = TestRenderer.create(
    <div>
      <ContextMenuRoot />
    </div>,
    {
      createNodeMock: contextMenuMock.bind(this, mock),
    }
  );

  const mockEvent = { preventDefault: jest.fn(), contextActions: [promise] };
  const handleContextMenu =
    mock.parentElement.addEventListener.mock.calls[0][1];
  handleContextMenu(mockEvent);

  expect(tree.root.findAllByType('button').length).toBe(0);
  expect(tree).toMatchSnapshot();
});

it('renders a menu from a promise returned from a function', () => {
  const mock = DEFAULT_MOCK();
  const promise = Promise.resolve([]);
  const fn = () => promise;

  const tree = TestRenderer.create(
    <div>
      <ContextMenuRoot />
    </div>,
    {
      createNodeMock: contextMenuMock.bind(this, mock),
    }
  );

  const mockEvent = { preventDefault: jest.fn(), contextActions: [fn] };
  const handleContextMenu =
    mock.parentElement.addEventListener.mock.calls[0][1];
  handleContextMenu(mockEvent);

  expect(tree.root.findAllByType('button').length).toBe(0);
  expect(tree).toMatchSnapshot();
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
