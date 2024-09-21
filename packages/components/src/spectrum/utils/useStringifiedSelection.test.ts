import { renderHook } from '@testing-library/react-hooks';
import { type NormalizedItem } from './itemUtils';
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

  it.each([null, undefined])(
    'should return null or undefined for null or undefined keys: %s',
    nullOrUndefinedKey => {
      const { result } = renderHook(() =>
        useStringifiedSelection({
          normalizedItems,
          selectedKey: nullOrUndefinedKey,
          defaultSelectedKey: undefined,
          disabledKeys: undefined,
          onChange: undefined,
        })
      );

      expect(result.current).toEqual({
        selectedStringKey: nullOrUndefinedKey,
        defaultSelectedStringKey: undefined,
        disabledStringKeys: undefined,
        onStringSelectionChange: expect.any(Function),
      });
    }
  );

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

  it.each([undefined, jest.fn().mockName('onChange')])(
    'should call onChange with actual key: %s',
    onChange => {
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

      if (onChange) {
        expect(onChange).toHaveBeenCalledWith(2);
      }
    }
  );

  it('should call onChange with given key when actual key is not found', () => {
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

    result.current.onStringSelectionChange('some.key');

    expect(onChange).toHaveBeenCalledWith('some.key');
  });
});
