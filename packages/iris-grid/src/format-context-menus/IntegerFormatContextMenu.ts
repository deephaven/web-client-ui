import {
  IntegerColumnFormat,
  IntegerColumnFormatter,
} from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import FormatContextMenuUtils, {
  FormatContextMenuOption,
} from './FormatContextMenuUtils';

class IntegerFormatContextMenu {
  static defaultGroup = 10;

  static presetGroup = 20;

  static customGroup = 30;

  /**
   * Creates list of formatting options for Integer context menu
   * @param dh JSAPI instance
   * @param selectedFormat Selected format object, null for no selected format
   * @param onCustomFormatChange Callback to call when the custom format is changed
   * @returns Array of formatting options for the context menu
   */
  static getOptions(
    dh: DhType,
    selectedFormat: IntegerColumnFormat,
    onCustomFormatChange: (value: IntegerColumnFormat | null) => void
  ): FormatContextMenuOption[] {
    const formatItems = [
      {
        format: IntegerColumnFormatter.FORMAT_MILLIONS,
        group: IntegerFormatContextMenu.presetGroup,
      },
      {
        format: IntegerColumnFormatter.FORMAT_SCIENTIFIC_NOTATION,
        group: IntegerFormatContextMenu.presetGroup,
      },
    ];

    const defaultFormatOption = FormatContextMenuUtils.makeOption(
      'Default',
      null,
      IntegerFormatContextMenu.defaultGroup,
      FormatContextMenuUtils.isDefaultSelected(selectedFormat)
    );

    const presetFormatOptions = formatItems.map(item =>
      FormatContextMenuUtils.makeOption(
        item.format.label,
        item.format,
        item.group,
        IntegerColumnFormatter.isSameFormat(item.format, selectedFormat)
      )
    );

    const isCustomSelected =
      FormatContextMenuUtils.isCustomSelected(selectedFormat);

    const customFormat = isCustomSelected
      ? selectedFormat
      : IntegerColumnFormatter.makeCustomFormat();

    const customFormatOption = FormatContextMenuUtils.makeCustomFormatOption(
      customFormat,
      IntegerFormatContextMenu.customGroup,
      IntegerColumnFormatter.DEFAULT_FORMAT_STRING,
      isCustomSelected,
      formatString => {
        if (formatString != null) {
          const newCustomFormat =
            IntegerColumnFormatter.makeCustomFormat(formatString);
          if (IntegerColumnFormatter.isValid(dh, newCustomFormat)) {
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

export default IntegerFormatContextMenu;
