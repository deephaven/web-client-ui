import React from 'react';
import {
  TableColumnFormat,
  TableColumnFormatter,
} from '@deephaven/jsapi-utils';
import CustomFormatAction from './CustomFormatAction';

export interface FormatContextMenuOption {
  title: string;
  description: string;
  group: number;
  format: TableColumnFormat | null;
  isSelected: boolean;
}

export interface CustomFormatOption extends FormatContextMenuOption {
  menuElement: React.ReactElement;
}

class FormatContextMenuUtils {
  /**
   * Returns true if default option should be active in the context menu
   * @param selectedFormat selected format object or null
   */
  static isDefaultSelected(selectedFormat: TableColumnFormat): boolean {
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
   * @param selectedFormat selected format object or null
   */
  static isCustomSelected(selectedFormat: TableColumnFormat): boolean {
    return (
      selectedFormat &&
      selectedFormat.type === TableColumnFormatter.TYPE_CONTEXT_CUSTOM
    );
  }

  /**
   * Creates context menu option
   * @param title Context menu title
   * @param format Format object
   * @param group Context menu group
   * @param isSelected Is current option selected
   */
  static makeOption(
    title: string,
    format: TableColumnFormat | null,
    group: number,
    isSelected: boolean
  ): FormatContextMenuOption {
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
   * @param format Format object
   * @param group Context menu group
   * @param placeholder Input element placeholder
   * @param isSelected Is current option selected
   * @param onChange Input element onChange callback
   */
  static makeCustomFormatOption(
    format: TableColumnFormat,
    group: number,
    placeholder: string,
    isSelected: boolean,
    onChange: (value: string | null) => void
  ): CustomFormatOption {
    return {
      title: format.label,
      description: format.label,
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
