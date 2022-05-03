import React, { useEffect, useState } from 'react';
import Log from '@deephaven/log';
import { TimeUtils } from '@deephaven/utils';
import MaskedInput, {
  DEFAULT_GET_PREFERRED_REPLACEMENT_STRING,
  SelectionSegment,
} from './MaskedInput';

const log = Log.module('TimeInput');

const TIME_PATTERN = '([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]';
const EXAMPLES = ['00:00:00', '12:34:56', '23:59:59'];

type TimeInputProps = {
  allowValueWrapping?: boolean;
  className?: string;
  onChange?(timeInSec: number): void;
  value?: number;
  onFocus?(): void;
  onBlur?(): void;
  'data-testid'?: string;
};

// Forward ref causes a false positive for display-name in eslint:
// https://github.com/yannickcr/eslint-plugin-react/issues/2269
// eslint-disable-next-line react/display-name
const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  (props: TimeInputProps, ref) => {
    const {
      allowValueWrapping = true,
      className = '',
      onChange = () => false,
      value: propsValue = 0,
      onFocus = () => false,
      onBlur = () => false,
      'data-testid': dataTestId,
    } = props;
    const [value, setValue] = useState(TimeUtils.formatTime(propsValue));
    const [selection, setSelection] = useState<SelectionSegment>();
    useEffect(() => {
      setValue(TimeUtils.formatTime(propsValue));
    }, [propsValue]);

    function getNextSegmentValue(
      range: SelectionSegment,
      delta: number,
      segmentValue: string
    ): string {
      // Delta is backward because negative Y is up
      const maxValue = range.selectionStart === 0 ? 24 : 60;
      let newSegmentValue = parseInt(segmentValue, 10) - delta;
      if (Number.isNaN(newSegmentValue)) {
        newSegmentValue = 0;
      } else if (allowValueWrapping) {
        // Add max value and re-mod so we don't get negative values after mod
        newSegmentValue = ((newSegmentValue % maxValue) + maxValue) % maxValue;
      } else {
        newSegmentValue = Math.min(Math.max(0, newSegmentValue), maxValue - 1);
      }
      return `${newSegmentValue}`.padStart(2, '0');
    }

    function getPreferredReplacementString(
      replaceValue: string,
      replaceIndex: number,
      newChar: string,
      selectionStart: number,
      selectionEnd: number
    ) {
      if (
        selectionStart === 0 &&
        selectionEnd === 2 &&
        replaceIndex === 1 &&
        parseInt(newChar, 10) > 1
      ) {
        // DH-10082 Special case for when typing `3` when it's already 12
        return `0${newChar}${replaceValue.substring(2)}`;
      }
      return DEFAULT_GET_PREFERRED_REPLACEMENT_STRING(
        replaceValue,
        replaceIndex,
        newChar
      );
    }

    function handleChange(newValue: string): void {
      log.debug('handleChange', newValue);
      setValue(newValue);

      // Only send a change if the value is actually valid
      if (TimeUtils.isTimeString(newValue)) {
        onChange(TimeUtils.parseTime(newValue));
      }
    }

    function handleSelect(newSelection: SelectionSegment) {
      setSelection(newSelection);
    }

    return (
      <MaskedInput
        ref={ref}
        className={className}
        example={EXAMPLES}
        getNextSegmentValue={getNextSegmentValue}
        getPreferredReplacementString={getPreferredReplacementString}
        onChange={handleChange}
        onSelect={handleSelect}
        pattern={TIME_PATTERN}
        selection={selection}
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        data-testid={dataTestId}
      />
    );
  }
);

TimeInput.defaultProps = {
  allowValueWrapping: true,
  className: '',
  onChange: () => false,
  value: 0,
  onFocus: () => false,
  onBlur: () => false,
  'data-testid': undefined,
};

export default TimeInput;
