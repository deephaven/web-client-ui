/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint func-names: "off" */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IrisGridModelFactory } from '@deephaven/iris-grid';
import dh from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import type { Container } from '@deephaven/golden-layout';
import { Workspace } from '@deephaven/redux';
import { IrisGridPanel } from './IrisGridPanel';

const MockIrisGrid = jest.fn(() => null);

jest.mock('@deephaven/iris-grid', () => {
  const { forwardRef } = jest.requireActual('react');
  return {
    ...(jest.requireActual('@deephaven/iris-grid') as Record<string, unknown>),
    // eslint-disable-next-line react/jsx-props-no-spreading
    IrisGrid: forwardRef((props, ref) => <MockIrisGrid {...props} />),
  };
});

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
  return () =>
    Promise.resolve(table).then(resolved =>
      IrisGridModelFactory.makeModel(dh, resolved)
    );
}

function makeMakeApi() {
  return () => dh;
}

function makeIrisGridPanelWrapper(
  makeModel = makeMakeModel(),
  makeApi = makeMakeApi(),
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
      makeApi={makeApi}
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

async function expectLoading(container) {
  await waitFor(() =>
    expect(
      container.querySelector("[data-icon='circle-large']")
    ).toBeInTheDocument()
  );
  expect(container.querySelector("[data-icon='loading']")).toBeInTheDocument();
}

async function expectNotLoading(container) {
  await waitFor(() =>
    expect(
      container.querySelector("[data-icon='outline']")
    ).not.toBeInTheDocument()
  );
  expect(
    container.querySelector("[data-icon='loading']")
  ).not.toBeInTheDocument();
}

it('mounts and unmounts without crashing', async () => {
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
});

it('shows the loading spinner until grid is ready', async () => {
  const table = makeTable();
  const tablePromise = Promise.resolve(table);
  const makeModel = makeMakeModel(tablePromise);

  expect.assertions(6);
  const { container } = makeIrisGridPanelWrapper(makeModel);

  await expectLoading(container);

  await expectLoading(container);
  const params = ((MockIrisGrid.mock.calls[
    MockIrisGrid.mock.calls.length - 1
  ] as unknown) as {
    onStateChange(param1: unknown, param2: unknown);
  }[])[0];
  params.onStateChange({}, {});

  await expectNotLoading(container);
});

it('shows an error properly if table loading fails', async () => {
  const error = new Error('TEST ERROR MESSAGE');
  const tablePromise = Promise.reject(error);
  const makeModel = makeMakeModel(tablePromise);
  const { container } = makeIrisGridPanelWrapper(makeModel);
  await expectNotLoading(container);
  const msg = screen.getByText(
    'Unable to open table. Error: TEST ERROR MESSAGE'
  );
  expect(msg).toBeTruthy();
});
