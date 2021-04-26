import FormatContextMenuUtils from './FormatContextMenuUtils';
import { IntegerColumnFormatter } from '../formatters';

class IntegerFormatContextMenu {
  static defaultGroup = 10;

  static presetGroup = 20;

  static customGroup = 30;

  /**
   * Creates list of formatting options for Integer context menu
   * @param {Object} selectedFormat Selected format object, null for no selected format
   * @param {function} onCustomFormatChange Callback to call when the custom format is changed
   * @returns {Array} Array of formatting options for the context menu
   */
  static getOptions(selectedFormat, onCustomFormatChange) {
    const formatItems = [
      {
        format: IntegerColumnFormatter.FORMAT_MILLIONS,
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

    const isCustomSelected = FormatContextMenuUtils.isCustomSelected(
      selectedFormat
    );

    const customFormat = isCustomSelected
      ? selectedFormat
      : IntegerColumnFormatter.makeCustomFormat();

    const customFormatOption = FormatContextMenuUtils.makeCustomFormatOption(
      customFormat,
      IntegerFormatContextMenu.customGroup,
      IntegerColumnFormatter.DEFAULT_FORMAT_STRING,
      isCustomSelected,
      formatString => {
        if (formatString) {
          const newCustomFormat = IntegerColumnFormatter.makeCustomFormat(
            formatString
          );
          if (IntegerColumnFormatter.isValid(newCustomFormat)) {
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
