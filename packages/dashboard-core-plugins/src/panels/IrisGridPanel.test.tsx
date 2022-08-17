/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint func-names: "off" */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { IrisGridModelFactory } from '@deephaven/iris-grid';
import dh from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import { Container } from '@deephaven/golden-layout';
import { Workspace } from '@deephaven/redux';
import { IrisGridPanel } from './IrisGridPanel';

const MockIrisGrid = jest.fn(() => null);

jest.mock('@deephaven/iris-grid', () => ({
  ...(jest.requireActual('@deephaven/iris-grid') as Record<string, unknown>),
  // eslint-disable-next-line react/jsx-props-no-spreading
  IrisGrid: jest.fn(props => <MockIrisGrid {...props} />),
}));

jest.mock('@deephaven/dashboard', () => ({
  ...(jest.requireActual('@deephaven/dashboard') as Record<string, unknown>),
  LayoutUtils: {
    getIdFromPanel: jest.fn(() => 'TEST_ID'),
    getTitleFromContainer: jest.fn(() => 'TEST_PANEL_TITLE'),
  },
}));

function makeTable() {
  const columns = [new (dh as any).Column({ index: 0, name: '0' })];
  return new (dh as any).Table({ columns });
}

function makeGlComponent() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    trigger: jest.fn(),
    unbind: jest.fn(),
  };
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
  client = new (dh as any).Client(),
  workspace = {},
  settings = { timeZone: 'America/New_York' }
) {
  return render(
    <IrisGridPanel
      makeModel={makeModel}
      metadata={metadata}
      glContainer={(glContainer as unknown) as Container}
      glEventHub={glEventHub}
      user={user}
      inputFilters={inputFilters}
      links={links}
      workspace={workspace as Workspace}
      settings={settings}
      panelState={undefined}
      getDownloadWorker={() => undefined}
      loadPlugin={() => undefined}
      theme={undefined}
    />
  );
}

function expectLoading(container) {
  expect(
    container.querySelector("[data-icon='circle-large-outline']")
  ).toBeInTheDocument();
  expect(container.querySelector("[data-icon='loading']")).toBeInTheDocument();
}

function expectNotLoading(container) {
  expect(
    container.querySelector("[data-icon='outline']")
  ).not.toBeInTheDocument();
  expect(
    container.querySelector("[data-icon='loading']")
  ).not.toBeInTheDocument();
}

it('renders without crashing', () => {
  makeIrisGridPanelWrapper();
});

it('unmounts successfully without crashing', () => {
  makeIrisGridPanelWrapper();
});

it('unmounts while still resolving a table successfully', async () => {
  const table = makeTable();
  let tableResolve = null;
  const tablePromise = new Promise(resolve => {
    tableResolve = resolve;
  });
  const makeModel = makeMakeModel(tablePromise);

  const { unmount } = makeIrisGridPanelWrapper(makeModel);
  const spy = jest.spyOn(IrisGridPanel.prototype, 'setState');
  unmount();

  tableResolve(table);
  expect(spy).toHaveBeenCalledTimes(0);
  expect.assertions(1);

  await TestUtils.flushPromises();
});

it('shows the loading spinner until grid is ready', async () => {
  const table = makeTable();
  const tablePromise = Promise.resolve(table);
  const makeModel = makeMakeModel(tablePromise);

  expect.assertions(6);
  const { container } = makeIrisGridPanelWrapper(makeModel);

  expectLoading(container);

  await TestUtils.flushPromises();

  expectLoading(container);
  const params = ((MockIrisGrid.mock.calls[
    MockIrisGrid.mock.calls.length - 1
  ] as unknown) as {
    onStateChange(param1: unknown, param2: unknown);
  }[])[0];
  params.onStateChange({}, {});

  expectNotLoading(container);
});

it('shows an error properly if table loading fails', async () => {
  const error = new Error('TEST ERROR MESSAGE');
  const tablePromise = Promise.reject(error);
  const makeModel = makeMakeModel(tablePromise);
  const { container } = makeIrisGridPanelWrapper(makeModel);
  await TestUtils.flushPromises();
  expectNotLoading(container);
  const msg = screen.getByText(
    'Unable to open table. Error: TEST ERROR MESSAGE'
  );
  expect(msg).toBeTruthy();
});
