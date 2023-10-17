import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import Dashboard from '@deephaven/dashboard';
import { createMockStore } from '@deephaven/redux';
import { dh } from '@deephaven/jsapi-shim';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { type IdeConnection } from '@deephaven/jsapi-types';
import { ConnectionContext, PluginsContext } from '@deephaven/app-utils';
import {
  ChartPlugin,
  ConsolePlugin,
  FilterPlugin,
  GridPlugin,
  LinkerPlugin,
  MarkdownPlugin,
  WidgetLoaderPlugin,
} from '.';

function makeConnection(): IdeConnection {
  const connection = new dh.IdeConnection('http://mockserver');
  connection.getTable = jest.fn();
  connection.getObject = jest.fn();
  connection.subscribeToFieldUpdates = jest.fn();
  return connection;
}

it('handles mounting and unmount core plugins properly', () => {
  const store = createMockStore();
  const connection = makeConnection();
  render(
    <ApiContext.Provider value={dh}>
      <ConnectionContext.Provider value={connection}>
        <PluginsContext.Provider value={new Map()}>
          <Provider store={store}>
            <Dashboard>
              <FilterPlugin />
              <GridPlugin hydrate={() => undefined} />
              <ChartPlugin hydrate={() => undefined} />
              <ConsolePlugin />
              <LinkerPlugin />
              <MarkdownPlugin />
              <WidgetLoaderPlugin />
            </Dashboard>
          </Provider>
        </PluginsContext.Provider>
      </ConnectionContext.Provider>
    </ApiContext.Provider>
  );
});
