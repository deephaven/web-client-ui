import { PICKER_ITEM_HEIGHTS } from '@deephaven/utils';
import { useSpectrumThemeProvider } from '../../theme';

/**
 * Get Picker Item height for current scale.
 * @returns Picker Item height
 */
export function usePickerItemScale(): { itemHeight: number } {
  const { scale } = useSpectrumThemeProvider();
  const itemHeight = PICKER_ITEM_HEIGHTS[scale];

  return { itemHeight };
}

export default usePickerItemScale;
