import { DateTimeColumnFormatter } from '../formatters';
import FormatContextMenuUtils from './FormatContextMenuUtils';
import TableUtils from '../TableUtils';

class DateTimeFormatContextMenu {
  static dateGroup = 10;

  static timeGroup = 20;

  static dateTimeGroup = 30;

  /**
   * Creates list of formatting options for DateTime context menu
   * @param {Formatter} formatter Formatter instance
   * @param {Object} selectedFormat Selected format object, null for no selected format
   * @returns {Array} Array of formatting options for the context menu
   */
  static getOptions(formatter, selectedFormat) {
    const currentTime = new Date();
    const formatItems = [
      {
        group: DateTimeFormatContextMenu.dateGroup,
        formatString: 'yyyy-MM-dd',
      },
      {
        group: DateTimeFormatContextMenu.dateGroup,
        formatString: 'MM-dd-yyyy',
      },

      {
        group: DateTimeFormatContextMenu.timeGroup,
        formatString: 'HH:mm:ss',
      },
      {
        group: DateTimeFormatContextMenu.timeGroup,
        formatString: 'HH:mm:ss.SSS',
      },
      {
        group: DateTimeFormatContextMenu.timeGroup,
        formatString: 'HH:mm:ss.SSSSSSSSS',
      },

      {
        group: DateTimeFormatContextMenu.dateTimeGroup,
        formatString: `yyyy-MM-dd HH:mm:ss`,
      },
      {
        group: DateTimeFormatContextMenu.dateTimeGroup,
        formatString: `yyyy-MM-dd HH:mm:ss.SSS`,
      },
      {
        group: DateTimeFormatContextMenu.dateTimeGroup,
        formatString: `yyyy-MM-dd HH:mm:ss.SSSSSSSSS`,
      },
    ];

    const presetFormatOptions = formatItems.map(item => {
      const format = DateTimeColumnFormatter.makeFormat(
        '',
        item.formatString,
        DateTimeColumnFormatter.TYPE_CONTEXT_PRESET
      );
      const title = formatter.getFormattedString(
        currentTime,
        TableUtils.dataType.DATETIME,
        '',
        format
      );

      return FormatContextMenuUtils.makeOption(
        title,
        format,
        item.group,
        DateTimeColumnFormatter.isSameFormat(format, selectedFormat)
      );
    });

    const defaultOption = FormatContextMenuUtils.makeOption(
      'Default',
      null,
      DateTimeFormatContextMenu.dateGroup,
      FormatContextMenuUtils.isDefaultSelected(selectedFormat)
    );

    return [defaultOption, ...presetFormatOptions];
  }
}

export default DateTimeFormatContextMenu;
