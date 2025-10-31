import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMockStore } from '@deephaven/redux';
import { TestUtils } from '@deephaven/test-utils';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType } from '@deephaven/jsapi-types';
import App from './App';

// Mock the modules that App depends on
jest.mock('@deephaven/app-utils', () => ({
  AppDashboards: () => <div>AppDashboards</div>,
  GrpcLayoutStorage: jest.fn(),
  LocalWorkspaceStorage: jest.fn(() => ({
    load: jest.fn().mockResolvedValue({
      data: { settings: {} },
    }),
  })),
  useConnection: jest.fn(() => ({
    getObject: jest.fn(),
    getStorageService: jest.fn(),
  })),
  useServerConfig: jest.fn(() => ({})),
  useUser: jest.fn(() => ({ name: 'test-user' })),
}));

jest.mock('@deephaven/dashboard', () => ({
  getAllDashboardsData: jest.fn(() => ({})),
  setDashboardPluginData: jest.fn(),
  emitPanelOpen: jest.fn(),
  useCreateDashboardListener: jest.fn(),
}));

jest.mock('@deephaven/plugin', () => ({
  useDashboardPlugins: jest.fn(() => []),
}));

jest.mock('@deephaven/jsapi-bootstrap', () => ({
  ...jest.requireActual('@deephaven/jsapi-bootstrap'),
  getVariableDescriptor: jest.fn(),
  useApi: jest.fn(() => ({})),
  useClient: jest.fn(() => ({
    getStorageService: jest.fn(() => ({})),
  })),
}));

jest.mock('@deephaven/jsapi-utils', () => ({
  fetchVariableDefinition: jest.fn(),
}));

describe('App', () => {
  const mockApi = TestUtils.createMockProxy<DhType>();
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    // Create a minimal Redux store
    store = createMockStore();

    // Reset document.title before each test
    document.title = 'Deephaven Embedded Widget';

    // Mock window.location.search
    delete (window as any).location;
    (window as any).location = { search: '?name=testWidget' };
  });

  it('should update document title with widget name from URL parameter', async () => {
    render(
      <Provider store={store}>
        <ApiContext.Provider value={mockApi}>
          <App />
        </ApiContext.Provider>
      </Provider>
    );

    await waitFor(() => {
      expect(document.title).toBe('testWidget - Deephaven');
    });
  });

  it('should not update document title when name parameter is missing', async () => {
    (window as any).location = { search: '' };

    render(
      <Provider store={store}>
        <ApiContext.Provider value={mockApi}>
          <App />
        </ApiContext.Provider>
      </Provider>
    );

    // Give it a moment to potentially update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Title should remain the default
    expect(document.title).toBe('Deephaven Embedded Widget');
  });
});
