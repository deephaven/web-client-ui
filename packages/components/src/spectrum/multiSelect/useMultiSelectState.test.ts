import { renderHook, act } from '@testing-library/react';
import { useMultiSelectState } from './useMultiSelectState';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

const ALL_KEYS = ['a', 'b', 'c', 'd'];

describe('useMultiSelectState', () => {
  it('initializes with defaultSelectedKeys (uncontrolled)', () => {
    const { result } = renderHook(() =>
      useMultiSelectState({
        selectedKeys: undefined,
        defaultSelectedKeys: ['a', 'b'],
        disabledKeys: undefined,
        onChange: undefined,
        onSelectionChange: undefined,
        allKeys: ALL_KEYS,
      })
    );

    expect(result.current.selectedKeyArray).toEqual(['a', 'b']);
    expect(result.current.selectedKeys).toEqual(new Set(['a', 'b']));
  });

  it('uses controlled selectedKeys', () => {
    const { result } = renderHook(() =>
      useMultiSelectState({
        selectedKeys: ['c'],
        defaultSelectedKeys: undefined,
        disabledKeys: undefined,
        onChange: undefined,
        onSelectionChange: undefined,
        allKeys: ALL_KEYS,
      })
    );

    expect(result.current.selectedKeyArray).toEqual(['c']);
  });

  it('resolves "all" for selectedKeys', () => {
    const { result } = renderHook(() =>
      useMultiSelectState({
        selectedKeys: 'all',
        defaultSelectedKeys: undefined,
        disabledKeys: undefined,
        onChange: undefined,
        onSelectionChange: undefined,
        allKeys: ALL_KEYS,
      })
    );

    expect(result.current.selectedKeyArray).toEqual(ALL_KEYS);
  });

  it('defaults to empty selection', () => {
    const { result } = renderHook(() =>
      useMultiSelectState({
        selectedKeys: undefined,
        defaultSelectedKeys: undefined,
        disabledKeys: undefined,
        onChange: undefined,
        onSelectionChange: undefined,
        allKeys: ALL_KEYS,
      })
    );

    expect(result.current.selectedKeyArray).toEqual([]);
  });

  it('converts disabledKeys to listBoxDisabledKeys', () => {
    const { result } = renderHook(() =>
      useMultiSelectState({
        selectedKeys: undefined,
        defaultSelectedKeys: undefined,
        disabledKeys: ['b', 'c'],
        onChange: undefined,
        onSelectionChange: undefined,
        allKeys: ALL_KEYS,
      })
    );

    expect(result.current.listBoxDisabledKeys).toEqual(new Set(['b', 'c']));
  });

  describe('toggleKey', () => {
    it('adds a key that is not selected', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectState({
          selectedKeys: undefined,
          defaultSelectedKeys: ['a'],
          disabledKeys: undefined,
          onChange,
          onSelectionChange: undefined,
          allKeys: ALL_KEYS,
        })
      );

      act(() => {
        result.current.toggleKey('b');
      });

      expect(onChange).toHaveBeenCalledWith(new Set(['a', 'b']));
    });

    it('removes a key that is already selected', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectState({
          selectedKeys: undefined,
          defaultSelectedKeys: ['a', 'b'],
          disabledKeys: undefined,
          onChange,
          onSelectionChange: undefined,
          allKeys: ALL_KEYS,
        })
      );

      act(() => {
        result.current.toggleKey('a');
      });

      expect(onChange).toHaveBeenCalledWith(new Set(['b']));
    });

    it('calls onSelectionChange when onChange is not provided', () => {
      const onSelectionChange = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectState({
          selectedKeys: undefined,
          defaultSelectedKeys: [],
          disabledKeys: undefined,
          onChange: undefined,
          onSelectionChange,
          allKeys: ALL_KEYS,
        })
      );

      act(() => {
        result.current.toggleKey('d');
      });

      expect(onSelectionChange).toHaveBeenCalledWith(new Set(['d']));
    });
  });

  describe('applyListBoxSelection', () => {
    it('applies "all" selection', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectState({
          selectedKeys: undefined,
          defaultSelectedKeys: [],
          disabledKeys: undefined,
          onChange,
          onSelectionChange: undefined,
          allKeys: ALL_KEYS,
        })
      );

      act(() => {
        result.current.applyListBoxSelection('all', []);
      });

      expect(onChange).toHaveBeenCalledWith(new Set(ALL_KEYS));
    });

    it('preserves selected keys not in the filtered list', () => {
      const onChange = jest.fn();
      const filteredItems = [
        { kind: 'item' as const, key: 'b', label: 'B' },
        { kind: 'item' as const, key: 'c', label: 'C' },
      ];

      const { result } = renderHook(() =>
        useMultiSelectState({
          selectedKeys: undefined,
          defaultSelectedKeys: ['a'],
          disabledKeys: undefined,
          onChange,
          onSelectionChange: undefined,
          allKeys: ALL_KEYS,
        })
      );

      act(() => {
        result.current.applyListBoxSelection(new Set(['b']), filteredItems);
      });

      // 'a' is preserved because it wasn't in filteredItems, 'b' is new
      expect(onChange).toHaveBeenCalledWith(new Set(['a', 'b']));
    });
  });
});
