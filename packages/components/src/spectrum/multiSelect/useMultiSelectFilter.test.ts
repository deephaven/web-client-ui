import { renderHook, act } from '@testing-library/react';
import { useMultiSelectFilter } from './useMultiSelectFilter';
import type { MultiSelectFlatEntry } from './multiSelectUtils';

// Mock @react-aria/i18n useFilter to provide a simple case-insensitive contains
jest.mock('@react-aria/i18n', () => ({
  useFilter: () => ({
    contains: (str: string, sub: string) =>
      str.toLowerCase().includes(sub.toLowerCase()),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

const ENTRIES: MultiSelectFlatEntry[] = [
  { kind: 'item', key: 'apple', label: 'Apple' },
  { kind: 'item', key: 'banana', label: 'Banana' },
  { kind: 'item', key: 'cherry', label: 'Cherry' },
];

// wrappedChildren is not exercised here since JSX filtering is tested
// in multiSelectUtils.test.tsx; we pass an empty array.
const EMPTY_CHILDREN: React.ReactElement[] = [];

describe('useMultiSelectFilter', () => {
  it('returns all items when searchText is empty', () => {
    const { result } = renderHook(() =>
      useMultiSelectFilter({
        allEntries: ENTRIES,
        wrappedChildren: EMPTY_CHILDREN,
        inputValue: undefined,
        defaultInputValue: '',
        onInputChange: undefined,
        onSearchTextChange: undefined,
      })
    );

    expect(result.current.searchText).toBe('');
    expect(result.current.filteredItems).toHaveLength(3);
  });

  it('filters items by search text', () => {
    const { result } = renderHook(() =>
      useMultiSelectFilter({
        allEntries: ENTRIES,
        wrappedChildren: EMPTY_CHILDREN,
        inputValue: undefined,
        defaultInputValue: '',
        onInputChange: undefined,
        onSearchTextChange: undefined,
      })
    );

    act(() => {
      result.current.setSearchText('ban');
    });

    expect(result.current.searchText).toBe('ban');
    expect(result.current.filteredItems).toEqual([
      { kind: 'item', key: 'banana', label: 'Banana' },
    ]);
  });

  it('skips client-side filtering when onSearchTextChange is provided', () => {
    const onSearchTextChange = jest.fn();
    const { result } = renderHook(() =>
      useMultiSelectFilter({
        allEntries: ENTRIES,
        wrappedChildren: EMPTY_CHILDREN,
        inputValue: undefined,
        defaultInputValue: '',
        onInputChange: undefined,
        onSearchTextChange,
      })
    );

    act(() => {
      result.current.setSearchText('ban');
    });

    // Filtering is skipped — all items returned
    expect(result.current.filteredItems).toHaveLength(3);
    expect(onSearchTextChange).toHaveBeenCalledWith('ban');
  });

  it('uses controlled inputValue', () => {
    const onInputChange = jest.fn();
    const { result } = renderHook(() =>
      useMultiSelectFilter({
        allEntries: ENTRIES,
        wrappedChildren: EMPTY_CHILDREN,
        inputValue: 'ch',
        defaultInputValue: '',
        onInputChange,
        onSearchTextChange: undefined,
      })
    );

    expect(result.current.searchText).toBe('ch');
    expect(result.current.filteredItems).toEqual([
      { kind: 'item', key: 'cherry', label: 'Cherry' },
    ]);
  });

  it('calls onInputChange when setSearchText is called', () => {
    const onInputChange = jest.fn();
    const { result } = renderHook(() =>
      useMultiSelectFilter({
        allEntries: ENTRIES,
        wrappedChildren: EMPTY_CHILDREN,
        inputValue: undefined,
        defaultInputValue: '',
        onInputChange,
        onSearchTextChange: undefined,
      })
    );

    act(() => {
      result.current.setSearchText('xyz');
    });

    expect(onInputChange).toHaveBeenCalledWith('xyz');
  });
});
