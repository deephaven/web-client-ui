import type { FormattingRule } from './Formatter';
import { DateTimeColumnFormatter } from './formatters';

class FormatterUtils {
  static getColumnFormats(settings: {
    formatter: FormattingRule[];
  }): FormattingRule[] {
    const { formatter } = settings;
    return formatter;
  }

  static getDateTimeFormatterOptions(settings: {
    timeZone: string;
    defaultDateTimeFormat: string;
    showTimeZone: boolean;
    showTSeparator: boolean;
  }): Required<ConstructorParameters<typeof DateTimeColumnFormatter>[0]> {
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
