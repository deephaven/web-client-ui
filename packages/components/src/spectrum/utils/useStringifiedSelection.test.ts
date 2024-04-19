import { renderHook } from '@testing-library/react-hooks';
import { NormalizedItem } from './itemUtils';
import { useStringifiedSelection } from './useStringifiedSelection';

describe('useStringifiedSelection', () => {
  const normalizedItems: NormalizedItem[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(
    i => ({
      key: i,
      item: { key: i, content: `Item ${i}`, textValue: `Item ${i}` },
    })
  );

  const selectedKey = 1;
  const defaultSelectedKey = 4;
  const disabledKeys = [7, 8, 9];

  const selectedStringKey = '1';
  const defaultSelectedStringKey = '4';
  const disabledStringKeys = new Set(['7', '8', '9']);

  it('should stringify selections', () => {
    const { result } = renderHook(() =>
      useStringifiedSelection({
        normalizedItems,
        selectedKey,
        defaultSelectedKey,
        disabledKeys,
        onChange: undefined,
      })
    );

    expect(result.current).toEqual({
      selectedStringKey,
      defaultSelectedStringKey,
      disabledStringKeys,
      onStringSelectionChange: expect.any(Function),
    });
  });

  it('should call onChange with actual key', () => {
    const onChange = jest.fn().mockName('onChange');

    const { result } = renderHook(() =>
      useStringifiedSelection({
        normalizedItems,
        selectedKey,
        defaultSelectedKey,
        disabledKeys,
        onChange,
      })
    );

    result.current.onStringSelectionChange('2');

    expect(onChange).toHaveBeenCalledWith(2);
  });
});
