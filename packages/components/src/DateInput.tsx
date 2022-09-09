import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import Log from '@deephaven/log';
import type { SelectionSegment } from './MaskedInput';
import MaskedInput, {
  DEFAULT_GET_PREFERRED_REPLACEMENT_STRING,
} from './MaskedInput';
import useOptional from './useOptional';

const log = Log.module('DateInput');

const DATE_PATTERN = '[12][0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])';
const DEFAULT_VALUE_STRING = '2022-12-31';
const FIXED_WIDTH_SPACE = '\u2007';
const EMPTY_VALUE_STRING = DEFAULT_VALUE_STRING.replace(
  /[a-zA-Z0-9]/g,
  FIXED_WIDTH_SPACE
);
const EXAMPLES = [DEFAULT_VALUE_STRING];

type DateInputProps = {
  name?: string;
  className?: string;
  onChange?(date?: string): void;
  defaultValue?: string;
  onFocus?(): void;
  onBlur?(): void;
  optional?: boolean;
  'data-testid'?: string;
};

// Forward ref causes a false positive for display-name in eslint:
// https://github.com/yannickcr/eslint-plugin-react/issues/2269
// eslint-disable-next-line react/display-name
const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (props: DateInputProps, ref) => {
    const {
      name = undefined,
      className = '',
      onChange = () => false,
      defaultValue = undefined,
      onFocus = () => false,
      onBlur = () => false,
      optional = false,
      'data-testid': dataTestId,
    } = props;
    const [value, setValue] = useState(defaultValue ?? EMPTY_VALUE_STRING);
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

    const handleBlur = useCallback(
      e => {
        // Don't trigger onBlur if the focus stays within the same parent
        // i.e. changing focus between the input and the optional switch
        if (e.target?.parentElement !== e.relatedTarget?.parentElement) {
          onBlur();
        }
      },
      [onBlur]
    );

    const handleChange = useCallback(
      (newValue: string): void => {
        log.debug('handleChange', newValue);
        setValue(newValue);
        onChange(newValue);
      },
      [onChange]
    );

    const handleToggle = useCallback(
      isEnabled => {
        onChange(isEnabled ? value : undefined);
      },
      [value, onChange]
    );

    const [isEnabled, toggleComponent] = useOptional(
      optional,
      defaultValue,
      handleToggle,
      handleBlur
    );

    function handleSelect(newSelection: SelectionSegment) {
      setSelection(newSelection);
    }

    return (
      <div className="d-flex flex-row align-items-center">
        <MaskedInput
          ref={ref}
          name={name}
          className={classNames(className, { 'flex-grow-1 mr-2': optional })}
          disabled={!isEnabled}
          example={EXAMPLES}
          getNextSegmentValue={getNextSegmentValue}
          getPreferredReplacementString={
            DEFAULT_GET_PREFERRED_REPLACEMENT_STRING
          }
          onChange={handleChange}
          onSelect={handleSelect}
          pattern={DATE_PATTERN}
          selection={selection}
          value={isEnabled ? value : 'Empty'}
          onFocus={onFocus}
          onBlur={handleBlur}
          data-testid={dataTestId}
        />
        {toggleComponent}
      </div>
    );
  }
);

DateInput.defaultProps = {
  name: undefined,
  className: '',
  onChange: () => false,
  defaultValue: undefined,
  onFocus: () => false,
  onBlur: () => false,
  optional: false,
  'data-testid': undefined,
};

export default DateInput;
