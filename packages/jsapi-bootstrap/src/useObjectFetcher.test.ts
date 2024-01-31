import { act, renderHook } from '@testing-library/react-hooks';
import { useContext } from 'react';
import { TestUtils } from '@deephaven/utils';
import {
  getObjectMetadata,
  getVariableDefinition,
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

describe('getObjectMetadata', () => {
  it('should return the metadata for a definition', () => {
    const definition = { id: '1', name: 'name', title: 'title', type: 'type' };
    const metadata = getObjectMetadata(definition);
    expect(metadata).toEqual(definition);
  });
});

describe('getVariableDefinition', () => {
  it('should return the definition for the metadata', () => {
    const metadata = { id: '1', type: 'type', name: 'name', title: 'title' };
    const definition = { id: '1', type: 'type' };
    expect(getVariableDefinition(metadata)).toEqual(definition);
  });

  it('should return the definition for the metadata without an id', () => {
    const metadata = { name: 'name', title: 'title', type: 'type' };
    const definition = { name: 'name', title: 'title', type: 'type' };
    expect(getVariableDefinition(metadata)).toEqual(definition);
  });

  it('legacy handling should return the definition for the metadata without a title', () => {
    const metadata = { name: 'name', type: 'type' };
    const definition = { name: 'name', title: 'name', type: 'type' };
    expect(getVariableDefinition(metadata)).toEqual(definition);
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
