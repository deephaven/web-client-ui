import { renderHook } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import { useContext } from 'react';
import { TestUtils } from '@deephaven/test-utils';
import { useApi } from './useApi';

const { asMock } = TestUtils;

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();

  asMock(useContext).mockName('useContext');
});

describe('useApi', () => {
  it('should return API context value', () => {
    asMock(useContext).mockReturnValue(dh);

    const { result } = renderHook(() => useApi());
    expect(result.current).toBe(dh);
  });

  it('should throw if context is null', () => {
    asMock(useContext).mockReturnValue(null);

    const { result } = renderHook(() => useApi());
    expect(result.error).toEqual(
      new Error(
        'No API available in useApi. Was code wrapped in ApiBootstrap or ApiContext.Provider?'
      )
    );
  });
});
