import ShellQuote, { ParseEntry, ControlOperator } from 'shell-quote';
import dh from '@deephaven/jsapi-shim';

class ConsoleUtils {
  static hasComment(arg: ParseEntry): arg is { comment: string } {
    return (arg as { comment: string }).comment !== undefined;
  }

  static hasPattern(arg: ParseEntry): arg is { op: 'glob'; pattern: string } {
    return (arg as { pattern: string }).pattern !== undefined;
  }

  static hasOp(arg: ParseEntry): arg is { op: ControlOperator } {
    return (arg as { op: ControlOperator }).op !== undefined;
  }

  /**
   * Given the provided text, parse out arguments using shell quoting rules.
   * @param str The text to parse.
   * @return string[] of the arguments. Empty if no arguments found.
   */
  static parseArguments(str: unknown): string[] {
    if (!str || !(typeof str === 'string' || str instanceof String)) {
      return [];
    }

    // Parse can return an object, not just a string. See the `ParseEntry` type def for all types
    // We must map them all to strings. Filter out comments that will not be needed as well.
    return ShellQuote.parse(str as string)
      .filter(arg => !this.hasComment(arg))
      .map(arg => {
        let ret = `${arg}`;
        if (this.hasPattern(arg)) {
          ret = arg.pattern;
        } else if (this.hasOp(arg)) {
          ret = arg.op;
        }
        return ret;
      });
  }

  static formatTimestamp(date: Date): string | null {
    if (!date || !(date instanceof Date)) {
      return null;
    }

    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    const seconds = `${date.getSeconds()}`.padStart(2, '0');
    const milliseconds = `${date.getMilliseconds()}`.padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  static defaultHost(): string {
    let defaultHost = null;
    const apiUrl = process.env.REACT_APP_CORE_API_URL;
    if (apiUrl != null) {
      const url = new URL(apiUrl);
      defaultHost = url.hostname;
    } else {
      defaultHost = window.location.hostname;
    }
    return defaultHost;
  }

  static isTableType(type: unknown): boolean {
    return type === dh.VariableType.TABLE || type === dh.VariableType.TREETABLE;
  }

  static isWidgetType(type: unknown): boolean {
    return (
      type === dh.VariableType.FIGURE ||
      type === dh.VariableType.OTHERWIDGET ||
      type === dh.VariableType.PANDAS
    );
  }

  static isOpenableType(type: unknown): boolean {
    return ConsoleUtils.isTableType(type) || ConsoleUtils.isWidgetType(type);
  }

  static isFigureType(type: unknown): boolean {
    return type === dh.VariableType.FIGURE;
  }

  static isPandas(type: unknown): boolean {
    return type === dh.VariableType.PANDAS;
  }
}

export default ConsoleUtils;
