import ShellQuote from 'shell-quote';
import dh from '@deephaven/jsapi-shim';

class ConsoleUtils {
  /**
   * Given the provided text, parse out arguments using shell quoting rules.
   * @param str The text to parse.
   * @return string[] of the arguments. Empty if no arguments found.
   */
  static parseArguments(str) {
    if (!str || !(typeof str === 'string' || str instanceof String)) {
      return [];
    }

    // Parse can return an object, not just a string. See the `ParseEntry` type def for all types
    // We must map them all to strings. Filter out comments that will not be needed as well.
    return ShellQuote.parse(str)
      .filter(arg => !arg.comment)
      .map(arg => arg.pattern ?? arg.op ?? `${arg}`);
  }

  static formatTimestamp(date) {
    if (!date || !(date instanceof Date)) {
      return null;
    }

    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    const seconds = `${date.getSeconds()}`.padStart(2, '0');
    const milliseconds = `${date.getMilliseconds()}`.padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  static defaultHost() {
    let defaultHost = null;
    try {
      const url = new URL(process.env.REACT_APP_CORE_API_URL);
      defaultHost = url.hostname;
    } catch (error) {
      defaultHost = window.location.hostname;
    }
    return defaultHost;
  }

  static isTableType(type) {
    return type === dh.VariableType.TABLE || type === dh.VariableType.TREETABLE;
  }

  static isWidgetType(type) {
    return (
      type === dh.VariableType.FIGURE ||
      type === dh.VariableType.OTHERWIDGET ||
      type === dh.VariableType.PANDAS
    );
  }

  static isDataStringType(type) {
    return type === dh.VariableType.DATA_STRING;
  }

  static isOpenableType(type) {
    return (
      ConsoleUtils.isTableType(type) ||
      ConsoleUtils.isWidgetType(type) ||
      ConsoleUtils.isMatPlotLib(type)
    );
  }

  static isFigureType(type) {
    return type === dh.VariableType.FIGURE;
  }

  static isPandas(type) {
    return type === dh.VariableType.PANDAS;
  }

  static isMatPlotLib(type) {
    return type.startsWith('matplotlib');
  }
}

export default ConsoleUtils;
