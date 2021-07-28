/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
export class Formatter {
  getColumnTypeFormatter() {
    return 'string';
  }
}

export class FormatterUtils {
  static getColumnFormats = jest.fn();

  static getDateTimeFormatterOptions = jest.fn();
}

export class IrisGrid {}

export class TableUtils {
  static getColumnByName = jest.fn();
}

export default IrisGrid;
