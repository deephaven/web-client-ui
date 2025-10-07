import { type FormattingRule } from './Formatter';

export interface ColumnFormatSettings {
  formatter?: readonly FormattingRule[];
}

export interface DateTimeFormatSettings {
  timeZone?: string;
  defaultDateTimeFormat?: string;
  showTimeZone?: boolean;
  showTSeparator?: boolean;
}

export interface NumberFormatSettings {
  defaultDecimalFormatOptions?: {
    defaultFormatString?: string;
  };
  defaultIntegerFormatOptions?: {
    defaultFormatString?: string;
  };
  truncateNumbersWithPound?: boolean;
  showEmptyStrings?: boolean;
  showNullStrings?: boolean;
  showExtraGroupColumn?: boolean;
}

export interface Settings
  extends ColumnFormatSettings,
    DateTimeFormatSettings,
    NumberFormatSettings {
  webgl?: boolean;
}

export default Settings;
