import React, { KeyboardEvent, useCallback, useState } from 'react';
import classNames from 'classnames';
import Log from '@deephaven/log';
import MaskedInput, { SelectionSegment } from './MaskedInput';
import { getNextSegmentValue } from './DateInputUtils';
import { addSeparators } from './DateTimeInputUtils';

const log = Log.module('DateTimeInput');

// This could be more restrictive and restrict days to the number of days in the month...
// But then gotta take leap year into account and everything.
const DATE_PATTERN = '[12][0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])';
// Put zero width spaces in the nanosecond part of the date to allow jumping between segments
const TIME_PATTERN =
  '([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\\.[0-9]{3}\u200B[0-9]{3}\u200B[0-9]{3}';
const FULL_DATE_PATTERN = `${DATE_PATTERN} ${TIME_PATTERN}`;
const DATE_VALUE_STRING = '2022-01-01';
const DEFAULT_VALUE_STRING = `${DATE_VALUE_STRING} 00:00:00.000000000`;
const FULL_DATE_FORMAT = 'YYYY-MM-DD HH:MM:SS.SSSSSSSSS';

type DateTimeInputProps = {
  className?: string;
  onChange?: (value?: string) => void;
  defaultValue?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: (event?: KeyboardEvent<HTMLInputElement>) => void;
  'data-testid'?: string;
};

function fixIncompleteValue(value: string): string {
  if (value != null && value.length >= DATE_VALUE_STRING.length) {
    return `${value.substring(0, DATE_VALUE_STRING.length)}${value
      .substring(DATE_VALUE_STRING.length)
      .replace(/\u2007/g, '0')}${DEFAULT_VALUE_STRING.substring(value.length)}`;
  }
  return value;
}

function removeSeparators(value: string): string {
  return value.replace(/\u200B/g, '');
}

const EXAMPLES = [addSeparators(DEFAULT_VALUE_STRING)];

const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  (props: DateTimeInputProps, ref) => {
    const {
      className = '',
      onChange = () => undefined,
      defaultValue = '',
      onFocus = () => undefined,
      onBlur = () => undefined,
      onSubmit,
      'data-testid': dataTestId,
    } = props;
    const [value, setValue] = useState(
      defaultValue.length > 0 ? addSeparators(defaultValue) : ''
    );
    const [selection, setSelection] = useState<SelectionSegment>();

    const handleChange = useCallback(
      (newValue: string): void => {
        log.debug('handleChange', newValue);
        setValue(newValue);
        onChange(fixIncompleteValue(removeSeparators(newValue)));
      },
      [onChange]
    );

    const handleBlur = useCallback((): void => {
      const prevValue = removeSeparators(value);
      const fixedValue = fixIncompleteValue(prevValue);
      // Update the value displayed in the input
      // onChange with the fixed value already triggered in handleChange
      if (fixedValue !== prevValue) {
        setValue(addSeparators(fixedValue));
      }
      onBlur();
    }, [value, onBlur]);

    return (
      <div className="d-flex flex-row align-items-center">
        <MaskedInput
          ref={ref}
          className={classNames(className)}
          example={EXAMPLES}
          getNextSegmentValue={getNextSegmentValue}
          onChange={handleChange}
          onSelect={setSelection}
          onSubmit={onSubmit}
          pattern={FULL_DATE_PATTERN}
          placeholder={FULL_DATE_FORMAT}
          selection={selection}
          value={value}
          onFocus={onFocus}
          onBlur={handleBlur}
          data-testid={dataTestId}
        />
      </div>
    );
  }
);

DateTimeInput.displayName = 'DateTimeInput';

DateTimeInput.defaultProps = {
  className: '',
  onChange: () => undefined,
  defaultValue: '',
  onFocus: () => undefined,
  onBlur: () => undefined,
  'data-testid': undefined,
};

export default DateTimeInput;
