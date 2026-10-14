import type store from './store';

export function createMockStore(): typeof store {
  // react-redux uses useSyncExternalStore, which requires a stable state reference
  const state = {
    dashboardData: {},
    workspace: {
      data: {
        settings: {},
      },
    },
  };
  return {
    dispatch: jest.fn(() => undefined),
    getState: jest.fn(() => state),
    subscribe: jest.fn(() => () => undefined),
  } as unknown as typeof store;
}

export default createMockStore;
