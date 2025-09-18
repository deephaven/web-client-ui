import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import Log from '@deephaven/log';
import { EMPTY_FUNCTION, TimeUtils } from '@deephaven/utils';
import MaskedInput, { type SelectionSegment } from './MaskedInput';
import { DEFAULT_GET_PREFERRED_REPLACEMENT_STRING } from './MaskedInputUtils';

export type { SelectionSegment } from './MaskedInput';

const log = Log.module('TimeInput');

const TIME_PATTERN = '([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]';
const EXAMPLES = ['00:00:00', '12:34:56', '23:59:59'];

type TimeInputProps = {
  allowValueWrapping?: boolean;
  className?: string;
  onChange?: (timeInSec: number) => void;
  onSelect?: (selection: SelectionSegment) => void;
  value?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  'data-testid'?: string;
};

export type TimeInputElement = {
  focus: () => void;
  setSelection: (newSelection: SelectionSegment) => void;
};

function fixIncompleteValue(value: string): string {
  // If value is not a complete HH:mm:ss time, fill missing parts with 0
  if (value != null) {
    return `${value
      .substring(0, 8)
      .replace(/\u2007/g, '0')}${`00:00:00`.substring(value.length)}`;
  }
  return value;
}

// Forward ref causes a false positive for display-name in eslint:
// https://github.com/yannickcr/eslint-plugin-react/issues/2269
// eslint-disable-next-line react/display-name
const TimeInput = React.forwardRef<TimeInputElement, TimeInputProps>(
  (props: TimeInputProps, ref) => {
    const {
      allowValueWrapping = true,
      className = '',
      onChange = EMPTY_FUNCTION,
      value: propsValue = 0,
      onFocus = EMPTY_FUNCTION,
      onBlur = EMPTY_FUNCTION,
      onSelect = EMPTY_FUNCTION,
      'data-testid': dataTestId,
    } = props;
    const [value, setValue] = useState(TimeUtils.formatTime(propsValue));
    const parsedValueRef = useRef<number>(propsValue);
    const [selection, setSelection] = useState<SelectionSegment>();
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          inputRef.current?.focus();
        },
        setSelection: newSelection => {
          inputRef.current?.focus();
          setSelection(newSelection);
        },
      }),
      []
    );

    useEffect(
      function setFormattedTime() {
        // Ignore value prop update if it matches the displayed value
        // to preserve the displayed value while typing
        if (parsedValueRef.current !== propsValue) {
          setValue(TimeUtils.formatTime(propsValue));
          parsedValueRef.current = propsValue;
        }
      },
      [parsedValueRef, propsValue]
    );

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
    ): string {
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

    const handleChange = useCallback(
      (newValue: string): void => {
        log.debug('handleChange', newValue);
        setValue(newValue);
        parsedValueRef.current = TimeUtils.parseTime(
          fixIncompleteValue(newValue)
        );
        onChange(parsedValueRef.current);
      },
      [onChange]
    );

    const handleBlur = useCallback((): void => {
      const fixedValue = fixIncompleteValue(value);
      // Update the value displayed in the input
      // onChange with the fixed value already triggered in handleChange
      if (fixedValue !== value) {
        setValue(fixedValue);
      }
      onBlur();
    }, [value, onBlur]);

    const handleSelect = useCallback(
      (newSelection: SelectionSegment) => {
        setSelection(newSelection);
        onSelect(newSelection);
      },
      [onSelect]
    );

    return (
      <MaskedInput
        ref={inputRef}
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
        onBlur={handleBlur}
        data-testid={dataTestId}
      />
    );
  }
);

export default TimeInput;
