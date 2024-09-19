import { renderHook } from '@testing-library/react-hooks';
import { type NormalizedItem } from './itemUtils';
import { useStringifiedMultiSelection } from './useStringifiedMultiSelection';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useStringifiedMultiSelection', () => {
  const normalizedItems: NormalizedItem[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(
    i => ({
      key: i,
      item: { key: i, content: `Item ${i}`, textValue: `Item ${i}` },
    })
  );

  const selectedKeys = [1, 2, 3];
  const defaultSelectedKeys = [4, 5, 6];
  const disabledKeys = [7, 8, 9];

  const selectedStringKeys = new Set(['1', '2', '3']);
  const defaultSelectedStringKeys = new Set(['4', '5', '6']);
  const disabledStringKeys = new Set(['7', '8', '9']);

  it('should stringify selections', () => {
    const { result } = renderHook(() =>
      useStringifiedMultiSelection({
        normalizedItems,
        selectedKeys,
        defaultSelectedKeys,
        disabledKeys,
      })
    );

    expect(result.current).toEqual({
      selectedStringKeys,
      defaultSelectedStringKeys,
      disabledStringKeys,
      onStringSelectionChange: expect.any(Function),
    });
  });

  it.each([
    ['all', 'all'],
    [new Set(['1', '2', '3']), new Set([1, 2, 3])],
  ] as const)(
    `should call onChange with 'all' or actual keys`,
    (given, expected) => {
      const onChange = jest.fn().mockName('onChange');

      const { result } = renderHook(() =>
        useStringifiedMultiSelection({
          normalizedItems,
          selectedKeys,
          defaultSelectedKeys,
          disabledKeys,
          onChange,
        })
      );

      result.current.onStringSelectionChange(given);

      expect(onChange).toHaveBeenCalledWith(expected);
    }
  );
});
