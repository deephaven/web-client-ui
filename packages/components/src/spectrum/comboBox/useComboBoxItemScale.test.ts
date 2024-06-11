import { COMBO_BOX_ITEM_HEIGHTS, TestUtils } from '@deephaven/utils';
import type { ProviderContext } from '@react-types/provider';
import { renderHook } from '@testing-library/react-hooks';
import { useSpectrumThemeProvider } from '../../theme';
import { useComboBoxItemScale } from './useComboBoxItemScale';

const { asMock } = TestUtils;

jest.mock('../../theme');

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useSpectrumThemeProvider).mockName('useSpectrumThemeProvider');
});

describe('useComboBoxItemScale', () => {
  it.each([
    ['medium', COMBO_BOX_ITEM_HEIGHTS.medium],
    ['large', COMBO_BOX_ITEM_HEIGHTS.large],
  ] as const)('should return itemHeight for scale: %s', (scale, itemHeight) => {
    asMock(useSpectrumThemeProvider).mockReturnValue({
      scale,
    } as ProviderContext);

    const { result } = renderHook(() => useComboBoxItemScale());
    expect(result.current).toEqual({
      itemHeight,
    });
  });
});
