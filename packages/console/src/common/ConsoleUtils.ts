import ShellQuote, { ParseEntry, ControlOperator } from 'shell-quote';
import type { dh as DhType } from '@deephaven/jsapi-types';

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
   * @returns string[] of the arguments. Empty if no arguments found.
   */
  static parseArguments(str: unknown): string[] {
    if (str == null || !(typeof str === 'string' || str instanceof String)) {
      return [];
    }

    // Parse can return an object, not just a string. See the `ParseEntry` type def for all types
    // We must map them all to strings. Filter out comments that will not be needed as well.
    return ShellQuote.parse(str as string)
      .filter(arg => !this.hasComment(arg))
      .map(arg => {
        if (this.hasPattern(arg)) {
          return arg.pattern;
        }
        if (this.hasOp(arg)) {
          return arg.op;
        }
        return `${arg}`;
      });
  }

  static formatTimestamp(date: Date): string | null {
    if (date == null || !(date instanceof Date)) {
      return null;
    }

    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    const seconds = `${date.getSeconds()}`.padStart(2, '0');
    const milliseconds = `${date.getMilliseconds()}`.padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  static isTableType(dh: DhType, type: string): boolean {
    return (
      type === dh.VariableType.TABLE ||
      type === dh.VariableType.TREETABLE ||
      type === dh.VariableType.HIERARCHICALTABLE
    );
  }

  static isWidgetType(dh: DhType, type: string): boolean {
    return (
      type === dh.VariableType.FIGURE ||
      type === dh.VariableType.OTHERWIDGET ||
      type === dh.VariableType.PANDAS
    );
  }

  static isOpenableType(dh: DhType, type: string): boolean {
    return (
      ConsoleUtils.isTableType(dh, type) || ConsoleUtils.isWidgetType(dh, type)
    );
  }

  static isFigureType(dh: DhType, type: string): boolean {
    return type === dh.VariableType.FIGURE;
  }

  static isPandas(dh: DhType, type: string): boolean {
    return type === dh.VariableType.PANDAS;
  }
}

export default ConsoleUtils;
