import {
  type CalendarDate,
  type CalendarDateTime,
  type ZonedDateTime,
} from '@internationalized/date';

export {
  Calendar,
  type SpectrumCalendarProps as CalendarProps,
  DateField,
  type SpectrumDateFieldProps as DateFieldProps,
  DatePicker,
  type SpectrumDatePickerProps as DatePickerProps,
  DateRangePicker,
  type SpectrumDateRangePickerProps as DateRangePickerProps,
  RangeCalendar,
  type SpectrumRangeCalendarProps as RangeCalendarProps,
  TimeField,
  type SpectrumTimeFieldProps as TimeFieldProps,
} from '@adobe/react-spectrum';

export type { CalendarDate, CalendarDateTime, ZonedDateTime };

// This is the type for the DatePicker value
export type DateValue = CalendarDate | CalendarDateTime | ZonedDateTime;

// This is the type for DatePicker onChange
export type MappedDateValue<T> = T extends ZonedDateTime
  ? ZonedDateTime
  : T extends CalendarDateTime
  ? CalendarDateTime
  : T extends CalendarDate
  ? CalendarDate
  : never;
