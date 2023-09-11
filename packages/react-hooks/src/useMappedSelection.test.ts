import { Key } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { KeyedItem, TestUtils } from '@deephaven/utils';
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
  const { result } = renderHook(() =>
    useMappedSelection(viewportData, mapName)
  );

  expect(optimizeSelection).toHaveBeenCalledWith(
    viewportData.selectedKeys,
    viewportData.items.length
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
