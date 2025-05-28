import { Key } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { KeyedItem } from '@deephaven/utils';
import { TestUtils } from '@deephaven/test-utils';
import { useMappedSelection } from './useMappedSelection';
import { WindowedListData } from './useWindowedListData';
import { mapSelection, optimizeSelection } from './SelectionUtils';

const { asMock, createMockProxy } = TestUtils;

jest.mock('./SelectionUtils', () => ({
  ...jest.requireActual('./SelectionUtils'),
  mapSelection: jest.fn(),
  optimizeSelection: jest.fn(),
}));

const viewportData = createMockProxy<
  WindowedListData<KeyedItem<{ user: string }>>
>({
  selectedKeys: 'all',
  items: [],
});
const mapName = jest.fn<string, [KeyedItem<{ user: string }>]>();

const mapSelectionResult = new Set(['map-a', 'map-b', 'map-c']);
const optimizeSelectionResult = {
  selection: new Set<Key>(),
  isInverted: true,
};

beforeEach(() => {
  jest.clearAllMocks();

  asMock(mapSelection).mockReturnValue(mapSelectionResult);
  asMock(optimizeSelection).mockReturnValue(optimizeSelectionResult);

  asMock(viewportData.getItem).mockImplementation(key => ({
    key: String(key),
    item: { user: `user-${key}` },
  }));
});

it('should optimize selection and map it to another selection', () => {
  const getKey = jest.fn().mockName('getKey');

  const { result } = renderHook(() =>
    useMappedSelection(viewportData, mapName, getKey)
  );

  expect(optimizeSelection).toHaveBeenCalledWith(
    viewportData.selectedKeys,
    viewportData.items.length,
    getKey
  );

  expect(mapSelection).toHaveBeenCalledWith(
    optimizeSelectionResult.selection,
    viewportData.getItem,
    mapName
  );

  expect(result.current).toEqual({
    selection: mapSelectionResult,
    isInverted: optimizeSelectionResult.isInverted,
  });
});
