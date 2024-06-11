import { COMBO_BOX_ITEM_HEIGHTS } from '@deephaven/utils';
import { useSpectrumThemeProvider } from '../../theme';

/**
 * Get ComboBox Item height for current scale.
 * @returns ComboBox Item height
 */
export function useComboBoxItemScale(): { itemHeight: number } {
  const { scale } = useSpectrumThemeProvider();
  const itemHeight = COMBO_BOX_ITEM_HEIGHTS[scale];

  return { itemHeight };
}

export default useComboBoxItemScale;
