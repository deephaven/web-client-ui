import {
  DecimalColumnFormat,
  DecimalColumnFormatter,
} from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import FormatContextMenuUtils, {
  FormatContextMenuOption,
} from './FormatContextMenuUtils';

class DecimalFormatContextMenu {
  static defaultGroup = 10;

  static presetGroup = 20;

  static presetRoundGroup = 30;

  static customGroup = 40;

  /**
   * Creates list of formatting options for Decimal context menu
   * @param dh JSAPI instance
   * @param selectedFormat Selected format object, null for no selected format
   * @param onCustomFormatChange Callback to call when the custom format is changed
   * @returns Array of formatting options for the context menu
   */
  static getOptions(
    dh: DhType,
    selectedFormat: DecimalColumnFormat,
    onCustomFormatChange: (value: DecimalColumnFormat | null) => void
  ): FormatContextMenuOption[] {
    const formatItems = [
      {
        format: DecimalColumnFormatter.FORMAT_PERCENT,
        group: DecimalFormatContextMenu.presetGroup,
      },
      {
        format: DecimalColumnFormatter.FORMAT_BASIS_POINTS,
        group: DecimalFormatContextMenu.presetGroup,
      },
      {
        format: DecimalColumnFormatter.FORMAT_MILLIONS,
        group: DecimalFormatContextMenu.presetGroup,
      },
      {
        format: DecimalColumnFormatter.FORMAT_SCIENTIFIC_NOTATION,
        group: DecimalFormatContextMenu.presetGroup,
      },
      {
        format: DecimalColumnFormatter.FORMAT_ROUND,
        group: DecimalFormatContextMenu.presetRoundGroup,
      },
      {
        format: DecimalColumnFormatter.FORMAT_ROUND_TWO_DECIMALS,
        group: DecimalFormatContextMenu.presetRoundGroup,
      },
      {
        format: DecimalColumnFormatter.FORMAT_ROUND_FOUR_DECIMALS,
        group: DecimalFormatContextMenu.presetRoundGroup,
      },
    ];

    const defaultFormatOption = FormatContextMenuUtils.makeOption(
      'Default',
      null,
      DecimalFormatContextMenu.defaultGroup,
      FormatContextMenuUtils.isDefaultSelected(selectedFormat)
    );

    const presetFormatOptions = formatItems.map(item =>
      FormatContextMenuUtils.makeOption(
        item.format.label,
        item.format,
        item.group,
        DecimalColumnFormatter.isSameFormat(item.format, selectedFormat)
      )
    );

    const isCustomSelected = FormatContextMenuUtils.isCustomSelected(
      selectedFormat
    );

    const customFormat = isCustomSelected
      ? selectedFormat
      : DecimalColumnFormatter.makeCustomFormat();

    const customFormatOption = FormatContextMenuUtils.makeCustomFormatOption(
      customFormat,
      DecimalFormatContextMenu.customGroup,
      DecimalColumnFormatter.DEFAULT_FORMAT_STRING,
      isCustomSelected,
      formatString => {
        if (formatString != null) {
          const newCustomFormat = DecimalColumnFormatter.makeCustomFormat(
            formatString
          );
          if (DecimalColumnFormatter.isValid(dh, newCustomFormat)) {
            onCustomFormatChange(newCustomFormat);
          }
        } else {
          onCustomFormatChange(null);
        }
      }
    );

    return [defaultFormatOption, ...presetFormatOptions, customFormatOption];
  }
}

export default DecimalFormatContextMenu;
