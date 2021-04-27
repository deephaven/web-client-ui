class FormatterUtils {
  static getColumnFormats(settings) {
    const { formatter } = settings;
    return formatter;
  }

  static getDateTimeFormatterOptions(settings) {
    const {
      timeZone,
      defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
    } = settings;
    return {
      timeZone,
      defaultDateTimeFormatString: defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
    };
  }
}

export default FormatterUtils;
