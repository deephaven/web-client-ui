import React from 'react';
import CustomFormatAction from './CustomFormatAction';
import { TableColumnFormatter } from '../formatters';

class FormatContextMenuUtils {
  /**
   * Returns true if default option should be active in the context menu
   * @param {Object} selectedFormat selected format object or null
   */
  static isDefaultSelected(selectedFormat) {
    return (
      !selectedFormat ||
      ![
        TableColumnFormatter.TYPE_CONTEXT_CUSTOM,
        TableColumnFormatter.TYPE_CONTEXT_PRESET,
      ].includes(selectedFormat.type)
    );
  }

  /**
   * Returns true if custom format option should be active in the context menu
   * @param {Object} selectedFormat selected format object or null
   */
  static isCustomSelected(selectedFormat) {
    return (
      selectedFormat &&
      selectedFormat.type === TableColumnFormatter.TYPE_CONTEXT_CUSTOM
    );
  }

  /**
   * Creates context menu option
   * @param {Object} format Format object
   * @param {number} group Context menu group
   * @param {boolean} isSelected Is current option selected
   */
  static makeOption(title, format, group, isSelected) {
    return {
      title,
      description: title,
      group,
      format,
      isSelected,
    };
  }

  /**
   * Creates context menu option with an input element
   * @param {Object} format Format object
   * @param {number} group Context menu group
   * @param {string} placeholder Input element placeholder
   * @param {boolean} isSelected Is current option selected
   * @param {function} onChange Input element onChange callback
   */
  static makeCustomFormatOption(
    format,
    group,
    placeholder,
    isSelected,
    onChange
  ) {
    return {
      title: format.label,
      format,
      group,
      isSelected,
      menuElement: (
        <CustomFormatAction
          formatString={format.formatString}
          title={format.label}
          placeholder={placeholder}
          onChange={onChange}
        />
      ),
    };
  }
}

export default FormatContextMenuUtils;
