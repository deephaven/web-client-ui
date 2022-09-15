import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import Log from '@deephaven/log';
import type { SelectionSegment } from './MaskedInput';
import MaskedInput, {
  DEFAULT_GET_PREFERRED_REPLACEMENT_STRING,
} from './MaskedInput';

const log = Log.module('DateInput');

const DATE_PATTERN = '[12][0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])';
const EXAMPLES = ['2000-01-01', '2022-12-31'];
const DATE_FORMAT = 'yyyy-MM-dd';

type DateInputProps = {
  className?: string;
  onChange?(date?: string): void;
  defaultValue?: string;
  onFocus?(): void;
  onBlur?(): void;
  'data-testid'?: string;
};

// Forward ref causes a false positive for display-name in eslint:
// https://github.com/yannickcr/eslint-plugin-react/issues/2269
// eslint-disable-next-line react/display-name
const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (props: DateInputProps, ref) => {
    const {
      className = '',
      onChange = () => false,
      defaultValue = '',
      onFocus = () => false,
      onBlur = () => false,
      'data-testid': dataTestId,
    } = props;
    const [value, setValue] = useState(defaultValue);
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
      return `${newSegmentValue}`.padStart(length, '0');
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
      return '';
    }

    const handleChange = useCallback(
      (newValue: string): void => {
        log.debug('handleChange', newValue);
        setValue(newValue);
        onChange(newValue);
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
          pattern={DATE_PATTERN}
          placeholder={DATE_FORMAT}
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

DateInput.defaultProps = {
  className: '',
  onChange: () => false,
  defaultValue: '',
  onFocus: () => false,
  onBlur: () => false,
  'data-testid': undefined,
};

export default DateInput;
