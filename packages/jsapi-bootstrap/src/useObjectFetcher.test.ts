import { act, renderHook } from '@testing-library/react-hooks';
import { useContext } from 'react';
import { TestUtils } from '@deephaven/utils';
import { getVariableDescriptor, useObjectFetcher } from './useObjectFetcher';

const { asMock, flushPromises } = TestUtils;

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useContext).mockName('useContext');
});

describe('getObjectMetadata', () => {
  const id = 'id';
  const name = 'name';
  const type = 'type';
  it('should return the descriptor for a title', () => {
    const descriptor = getVariableDescriptor({ type, title: name });
    expect(descriptor).toEqual({ type, name });
  });
  it('should return the descriptor for a name (deprecated on VariableDefinition)', () => {
    const descriptor = getVariableDescriptor({ type, name });
    expect(descriptor).toEqual({ type, name });
  });

  it('should return the descriptor for an id', () => {
    const descriptor = getVariableDescriptor({ type, id });
    expect(descriptor).toEqual({ type, id });
  });
  it('should throw if the name, title, or id are not provided', () => {
    expect(() => getVariableDescriptor({ type })).toThrow();
  });
});

it('should resolve the fetcher when set in the context', async () => {
  const fetcher = jest.fn(async () => undefined);
  asMock(useContext).mockReturnValue(fetcher);

  const { result } = renderHook(() => useObjectFetcher());
  await act(flushPromises);
  expect(result.current).toEqual(fetcher);
  expect(result.error).toBeUndefined();
  expect(fetcher).not.toHaveBeenCalled();
});

it('throws an error if the context is null', async () => {
  asMock(useContext).mockReturnValue(null);

  const { result } = renderHook(() => useObjectFetcher());
  expect(result.error).not.toBeNull();
});
