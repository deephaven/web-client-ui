import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import Log from '@deephaven/log';
import type { SelectionSegment } from './MaskedInput';
import MaskedInput, {
  DEFAULT_GET_PREFERRED_REPLACEMENT_STRING,
} from './MaskedInput';

const log = Log.module('DateTimeInput');

// This could be more restrictive and restrict days to the number of days in the month...
// But then gotta take leap year into account and everything.
const DATE_PATTERN = '[12][0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])';
// Put zero width spaces in the nanosecond part of the date to allow jumping between segments
const TIME_PATTERN =
  '([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\\.[0-9]{3}\u200B[0-9]{3}\u200B[0-9]{3}';
const FULL_DATE_PATTERN = `${DATE_PATTERN} ${TIME_PATTERN}`;
const DEFAULT_VALUE_STRING = '2022-01-01 00:00:00.000000000';
const FULL_DATE_FORMAT = 'YYYY-MM-DD HH:MM:SS.SSSSSSSSS';

type DateTimeInputProps = {
  className?: string;
  onChange?(value?: string): void;
  defaultValue?: string;
  onFocus?(): void;
  onBlur?(): void;
  'data-testid'?: string;
};

export function addSeparators(value: string): string {
  const dateTimeMillis = value.substring(0, 23);
  const micros = value.substring(23, 26);
  const nanos = value.substring(26);
  return [dateTimeMillis, micros, nanos].filter(v => v !== '').join('\u200B');
}

const removeSeparators = (value: string) => value.replace(/\u200B/g, '');

const EXAMPLES = [addSeparators(DEFAULT_VALUE_STRING)];

const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  (props: DateTimeInputProps, ref) => {
    const {
      className = '',
      onChange = () => false,
      defaultValue = '',
      onFocus = () => false,
      onBlur = () => false,
      'data-testid': dataTestId,
    } = props;
    const [value, setValue] = useState(
      defaultValue.length > 0 ? addSeparators(defaultValue) : ''
    );
    const [selection, setSelection] = useState<SelectionSegment>();

    function getNextNumberSegmentValue(
      delta: number,
      segmentValue: string,
      lowerBound: number,
      upperBound: number,
      length: number
    ) {
      const modValue = upperBound - lowerBound + 1;
      const newSegmentValue =
        ((((parseInt(segmentValue, 10) - delta - lowerBound) % modValue) +
          modValue) %
          modValue) +
        lowerBound;
      const result = `${newSegmentValue}`.padStart(length, '0');
      log.debug('getNextNumberSegmentValue', modValue, newSegmentValue, result);
      return result;
    }

    function getNextSegmentValue(
      range: SelectionSegment,
      delta: number,
      segmentValue: string
    ): string {
      const { selectionStart } = range;
      if (selectionStart === 0) {
        return getNextNumberSegmentValue(delta, segmentValue, 1900, 2099, 4);
      }
      if (selectionStart === 5) {
        return getNextNumberSegmentValue(delta, segmentValue, 1, 12, 2);
      }
      if (selectionStart === 8) {
        return getNextNumberSegmentValue(delta, segmentValue, 1, 31, 2);
      }
      if (selectionStart === 11) {
        // Hours input
        return getNextNumberSegmentValue(delta, segmentValue, 0, 23, 2);
      }
      if (selectionStart === 17 || selectionStart === 14) {
        // Minutes/seconds input
        return getNextNumberSegmentValue(delta, segmentValue, 0, 59, 2);
      }
      if (
        selectionStart === 20 ||
        selectionStart === 24 ||
        selectionStart === 28
      ) {
        // Milli, micro, and nanosecond input
        return getNextNumberSegmentValue(delta, segmentValue, 0, 999, 3);
      }

      return segmentValue;
    }

    const handleChange = useCallback(
      (newValue: string): void => {
        log.debug('handleChange', newValue);
        setValue(newValue);
        onChange(removeSeparators(newValue));
      },
      [onChange]
    );

    function handleSelect(newSelection: SelectionSegment) {
      setSelection(newSelection);
    }

    return (
      <div className="d-flex flex-row align-items-center">
        <MaskedInput
          ref={ref}
          className={classNames(className)}
          example={EXAMPLES}
          getNextSegmentValue={getNextSegmentValue}
          getPreferredReplacementString={
            DEFAULT_GET_PREFERRED_REPLACEMENT_STRING
          }
          onChange={handleChange}
          onSelect={handleSelect}
          pattern={FULL_DATE_PATTERN}
          placeholder={FULL_DATE_FORMAT}
          selection={selection}
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          data-testid={dataTestId}
        />
      </div>
    );
  }
);

DateTimeInput.defaultProps = {
  className: '',
  onChange: () => false,
  defaultValue: '',
  onFocus: () => false,
  onBlur: () => false,
  'data-testid': undefined,
};

export default DateTimeInput;
