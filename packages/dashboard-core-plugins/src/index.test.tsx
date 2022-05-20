import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import Dashboard from '@deephaven/dashboard';
import { createMockStore } from '@deephaven/redux';
import {
  ChartPlugin,
  ConsolePlugin,
  FilterPlugin,
  GridPlugin,
  LinkerPlugin,
  MarkdownPlugin,
  PandasPlugin,
} from '.';

it('handles mounting and unmount core plugins properly', () => {
  const store = createMockStore();
  render(
    <Provider store={store}>
      <Dashboard>
        <FilterPlugin />
        <GridPlugin hydrate={() => undefined} />
        <ChartPlugin hydrate={() => undefined} />
        <ConsolePlugin />
        <LinkerPlugin />
        <MarkdownPlugin />
        <PandasPlugin hydrate={() => undefined} />
      </Dashboard>
    </Provider>
  );
});
