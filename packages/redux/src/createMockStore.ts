import store from './store';

export function createMockStore(): typeof store {
  return ({
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
  } as unknown) as typeof store;
}

export default createMockStore;
