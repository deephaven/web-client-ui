import { act, renderHook } from '@testing-library/react-hooks';
import { useContext } from 'react';
import { TestUtils } from '@deephaven/utils';
import {
  getVariableDescriptor,
  sanitizeVariableDescriptor,
  useObjectFetcher,
} from './useObjectFetcher';

const { asMock, flushPromises } = TestUtils;

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useContext).mockName('useContext');
});

describe('sanitizeVariableDescriptor', () => {
  const id = 'id';
  const name = 'name';
  const type = 'type';
  it('should return the id if both name and id provided', () => {
    expect(sanitizeVariableDescriptor({ type, name, id })).toEqual({
      type,
      id,
    });
  });
  it('should return the name if no id provided', () => {
    expect(sanitizeVariableDescriptor({ type, name })).toEqual({ type, name });
  });
  it('should return the id if no name provided', () => {
    expect(sanitizeVariableDescriptor({ type, id })).toEqual({ type, id });
  });
  it('should throw if neither name nor id provided', () => {
    expect(() => sanitizeVariableDescriptor({ type })).toThrow();
  });
  it('should throw if the type is not provided', () => {
    expect(() => sanitizeVariableDescriptor({ name, id })).toThrow();
  });
});

describe('getVariableDescriptor', () => {
  const id = 'id';
  const name = 'name';
  const type = 'type';
  const title = 'title';

  it.each([
    [
      { type, name, id },
      { type, name, id },
    ],
    [
      { type, title },
      { type, name: title },
    ],
    // title takes precedence over name
    [
      { type, name, title, id },
      { type, name: title, id },
    ],
    [
      { type, title, name },
      { type, name: title },
    ],
    [
      { type, name },
      { type, name },
    ],
    [
      { type, id },
      { type, id },
    ],
  ])('should return the descriptor for %p', (input, expected) => {
    const descriptor = getVariableDescriptor(input);
    expect(descriptor).toEqual(expected);
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
