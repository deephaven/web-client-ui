/* eslint func-names: "off" */
import React from 'react';
import { mount } from 'enzyme';
import { IrisGridModelFactory } from '@deephaven/iris-grid';
import dh from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import { IrisGridPanel } from './IrisGridPanel';

jest.mock('@deephaven/iris-grid');
jest.mock('../../layout/LayoutUtils', () => ({
  getIdFromPanel: jest.fn(() => 'TEST_ID'),
  getTitleFromContainer: jest.fn(() => 'TEST_PANEL_TITLE'),
}));

function makeTable() {
  const columns = [new dh.Column({ index: 0, name: '0' })];
  return new dh.Table({ columns });
}

function makeGlComponent() {
  return { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
}

function makeMakeModel(table = makeTable()) {
  return () => Promise.resolve(table).then(IrisGridModelFactory.makeModel);
}

function makeIrisGridPanelWrapper(
  makeModel = makeMakeModel(),
  metadata = { table: 'table' },
  glContainer = makeGlComponent(),
  glEventHub = makeGlComponent(),
  inputFilters = [],
  links = [],
  user = TestUtils.REGULAR_USER,
  client = new dh.Client(),
  workspace = {}
) {
  return mount(
    <IrisGridPanel
      makeModel={makeModel}
      metadata={metadata}
      glContainer={glContainer}
      glEventHub={glEventHub}
      client={client}
      user={user}
      inputFilters={inputFilters}
      links={links}
      workspace={workspace}
    />
  );
}

it('renders without crashing', () => {
  makeIrisGridPanelWrapper();
});

it('unmounts successfully without crashing', () => {
  const wrapper = makeIrisGridPanelWrapper();
  wrapper.unmount();
});

it('unmounts while still resolving a table successfully', async () => {
  const table = makeTable();
  let tableResolve = null;
  const tablePromise = new Promise(resolve => {
    tableResolve = resolve;
  });
  const makeModel = makeMakeModel(tablePromise);

  const wrapper = makeIrisGridPanelWrapper(makeModel);
  const setState = jest.fn();
  wrapper.instance().setState = setState;
  wrapper.unmount();

  tableResolve(table);

  expect.assertions(1);

  await TestUtils.flushPromises();
  expect(setState).not.toHaveBeenCalled();
});

it('shows the loading spinner until grid is ready', async () => {
  const table = makeTable();
  const tablePromise = Promise.resolve(table);
  const makeModel = makeMakeModel(tablePromise);

  expect.assertions(4);
  const wrapper = makeIrisGridPanelWrapper(makeModel);

  expect(wrapper.find('LoadingOverlay').prop('isLoading')).toBe(true);

  await TestUtils.flushPromises();
  wrapper.update();

  expect(wrapper.find('LoadingOverlay').prop('isLoading')).toBe(true);

  wrapper.instance().handleGridStateChange({}, {});
  wrapper.update();

  expect(wrapper.state('isLoaded')).toBe(true);
  expect(wrapper.find('LoadingOverlay').prop('isLoading')).toBe(false);
});

it('shows an error properly if table loading fails', async () => {
  const error = new Error('TEST ERROR MESSAGE');
  const tablePromise = Promise.reject(error);
  const makeModel = makeMakeModel(tablePromise);
  const wrapper = makeIrisGridPanelWrapper(makeModel);
  await TestUtils.flushPromises();
  wrapper.update();
  expect(wrapper.state('error')).toBe(error);
  expect(wrapper.find('LoadingOverlay').prop('isLoading')).toBe(false);
  expect(wrapper.find('LoadingOverlay').prop('errorMessage')).not.toBe(null);
});
