import { PICKER_ITEM_HEIGHTS, TestUtils } from '@deephaven/utils';
import type { ProviderContext } from '@react-types/provider';
import { renderHook } from '@testing-library/react-hooks';
import { useSpectrumThemeProvider } from '../../theme';
import { usePickerItemScale } from './usePickerItemScale';

const { asMock } = TestUtils;

jest.mock('../../theme');

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useSpectrumThemeProvider).mockName('useSpectrumThemeProvider');
});

describe('usePickerItemScale', () => {
  it.each([
    ['medium', PICKER_ITEM_HEIGHTS.medium],
    ['large', PICKER_ITEM_HEIGHTS.large],
  ] as const)('should return itemHeight for scale: %s', (scale, itemHeight) => {
    asMock(useSpectrumThemeProvider).mockReturnValue({
      scale,
    } as ProviderContext);

    const { result } = renderHook(() => usePickerItemScale());
    expect(result.current).toEqual({
      itemHeight,
    });
  });
});
