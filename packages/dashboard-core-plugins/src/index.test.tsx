import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import Dashboard from '@deephaven/dashboard';
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
  const store = ({
    dispatch: jest.fn(() => undefined),
    getState: jest.fn(() => ({
      dashboardData: {},
      workspace: {
        data: {
          settings: {},
        },
      },
    })),
    subscribe: jest.fn(() => undefined),
  } as unknown) as Store;
  const dashboard = mount(
    <Provider store={store}>
      <Dashboard>
        <FilterPlugin />
        <ChartPlugin hydrate={() => undefined} />
        <ConsolePlugin />
        <GridPlugin hydrate={() => undefined} />
        <LinkerPlugin />
        <MarkdownPlugin />
        <PandasPlugin hydrate={() => undefined} />
      </Dashboard>
    </Provider>
  );
  dashboard.unmount();
});
