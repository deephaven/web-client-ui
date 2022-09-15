import React, { useMemo, useEffect } from 'react';
import classNames from 'classnames';
import Log from '@deephaven/log';
import { useForwardedRef } from '@deephaven/react-hooks';
import './MaskedInput.scss';

const log = Log.module('MaskedInput');

const SELECTION_DIRECTION = {
  FORWARD: 'forward',
  BACKWARD: 'backward',
  NONE: 'none',
} as const;

/**
 * Special space character that's the same size as tabular numbers
 * https://www.fileformat.info/info/unicode/char/2007/index.htm
 */
const FIXED_WIDTH_SPACE = '\u2007';

export function DEFAULT_GET_PREFERRED_REPLACEMENT_STRING(
  value: string,
  replaceIndex: number,
  newChar: string
): string {
  return (
    value.substring(0, replaceIndex) +
    newChar +
    value.substring(replaceIndex + 1)
  );
}

/**
 * Pad the string on the left with the example value to the given length
 * @param checkValue Initial string to pad
 * @param exampleValue Example value
 * @param length Target length
 * @returns String padded with the given example value
 */
export function fillToLength(
  checkValue: string,
  exampleValue: string,
  length: number
): string {
  return checkValue.length < length
    ? `${checkValue}${exampleValue.substring(checkValue.length, length)}`
    : checkValue;
}

export type SelectionSegment = {
  selectionStart: number;
  selectionEnd: number;
  selectionDirection?: typeof SELECTION_DIRECTION[keyof typeof SELECTION_DIRECTION];
};

type MaskedInputProps = {
  /** An extra class name to add to the component */
  className?: string;
  /** The regex pattern this masked input must match */
  pattern: string;
  /** Input placeholder */
  placeholder?: string;
  /** The current value to display */
  value: string;
  /** One or more examples of valid values. Used when deciding if next keystroke is valid (as rest of the current value may be incomplete) */
  example: string | string[];
  /** The current selection to use for the input */
  selection?: SelectionSegment;
  /** Called when the value changes. Note the value may still be incomplete. */
  onChange?(value: string): void;
  /** Called when selection changes */
  onSelect?(segment: SelectionSegment): void;
  /** Retrieve the next value for a provided segment */
  getNextSegmentValue?(
    segment: SelectionSegment,
    delta: number,
    segmentValue: string,
    value: string
  ): string;
  getPreferredReplacementString?(
    value: string,
    replaceIndex: number,
    replaceChar: string,
    selectionStart: number,
    selectionEnd: number
  ): string;
  onFocus?: React.FocusEventHandler;
  onBlur?: React.FocusEventHandler;
  'data-testid'?: string;
};

/**
 * A masked input for entering data from a template.
 * Won't work by itself, must use within another component and handle updating the value/selection.
 */
// Forward ref causes a false positive for display-name in eslint:
// https://github.com/yannickcr/eslint-plugin-react/issues/2269
// eslint-disable-next-line react/display-name
const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  (props: MaskedInputProps, ref) => {
    const {
      className,
      example,
      getNextSegmentValue = (range, delta, segmentValue) => segmentValue,
      getPreferredReplacementString = DEFAULT_GET_PREFERRED_REPLACEMENT_STRING,
      onChange = () => false,
      onSelect = () => false,
      pattern,
      placeholder,
      selection,
      value,
      onFocus = () => false,
      onBlur = () => false,
      'data-testid': dataTestId,
    } = props;
    const input = useForwardedRef(ref);
    const examples = useMemo(
      () => (Array.isArray(example) ? example : [example]),
      [example]
    );

    useEffect(
      function setSelectedSegment() {
        if (selection != null) {
          log.debug('setting selection...', selection);
          const {
            selectionStart,
            selectionEnd,
            selectionDirection,
          } = selection;
          input.current?.setSelectionRange(
            selectionStart,
            selectionEnd,
            selectionDirection
          );
          log.debug('selection set!');
        }
      },
      [selection, input]
    );

    /**
     * Returns the selection range for the segment at the given cursor position
     * @param cursorPosition The current position of the cursor
     */
    function getSegment(cursorPosition: number) {
      let selectionStart = cursorPosition;
      let selectionEnd = cursorPosition;
      const testValue = examples.length > 0 ? examples[0] : value;

      for (let i = selectionStart - 1; i >= 0; i -= 1) {
        if (!/[a-zA-Z0-9]/g.test(testValue.charAt(i))) {
          break;
        }

        selectionStart = i;
      }

      for (let i = selectionEnd; i < testValue.length; i += 1) {
        if (!/[a-zA-Z0-9]/g.test(testValue.charAt(i))) {
          break;
        }

        selectionEnd = i + 1;
      }

      const selectionDirection =
        selectionStart === selectionEnd
          ? SELECTION_DIRECTION.NONE
          : SELECTION_DIRECTION.BACKWARD;

      return {
        selectionStart,
        selectionEnd,
        selectionDirection,
      };
    }

    /**
     * Replaces all blank spaces and everything after the current cursor position with the example value
     * @param checkValue The value to check/fill in
     * @param exampleValue The example to fill in the value from
     * @param cursorPosition The cursor position
     * @returns The filled in value
     */
    function fillValue(
      checkValue: string,
      exampleValue: string,
      cursorPosition = checkValue.length
    ): string {
      let filledValue = '';
      for (let i = 0; i < cursorPosition; i += 1) {
        if (checkValue.charAt(i) !== FIXED_WIDTH_SPACE) {
          filledValue = filledValue.concat(checkValue[i]);
        } else {
          filledValue = filledValue.concat(exampleValue[i]);
        }
      }
      filledValue = filledValue.concat(exampleValue.substring(cursorPosition));

      return filledValue;
    }

    /**
     * Checks if a given `value` is valid up until the `cursorPosition`.
     * Uses the examples to build the rest of the string
     * @param checkValue The value to check validity of
     * @param cursorPosition The position of the cursor to check up to
     */
    function isValid(
      checkValue: string,
      cursorPosition = checkValue.length
    ): boolean {
      const patternRegex = new RegExp(pattern);
      if (patternRegex.test(checkValue)) {
        return true;
      }

      for (let i = 0; i < examples.length; i += 1) {
        const filledValue = fillValue(checkValue, examples[i], cursorPosition);
        if (patternRegex.test(filledValue)) {
          return true;
        }
      }
      return false;
    }

    /**
     * Returns the next segment after the given position
     * @param position The cursor position to start at
     * @returns The new selection range
     */
    function nextSegment(position: number): SelectionSegment {
      const currentSegment = getSegment(position);
      const nextPosition = currentSegment.selectionEnd + 1;
      if (nextPosition >= value.length) {
        return currentSegment;
      }

      return getSegment(nextPosition);
    }

    /**
     * Returns the previous segment before the given position
     * @param position The cursor position to start at
     * @returns The new selection range
     */
    function previousSegment(position: number): SelectionSegment {
      const currentSegment = getSegment(position);
      const previousPosition = currentSegment.selectionStart - 1;
      if (previousPosition <= 0) {
        return currentSegment;
      }

      return getSegment(previousPosition);
    }

    function nextSegmentValue(position: number, delta: number): void {
      const segment = getSegment(position);
      const segmentValue = value.substring(
        segment.selectionStart,
        segment.selectionEnd
      );
      const newSegmentValue = getNextSegmentValue(
        segment,
        delta,
        segmentValue,
        value
      );
      const newValue =
        value.substring(0, segment.selectionStart) +
        newSegmentValue +
        value.substring(segment.selectionEnd);
      if (isValid(newValue, segment.selectionEnd)) {
        onChange(newValue);
        onSelect(segment);
      }
    }

    function handleSelect(event: React.UIEvent<HTMLInputElement>) {
      const {
        selectionStart = 0,
        selectionEnd = 0,
        selectionDirection = 'none',
      } = event.target as HTMLInputElement;

      if (
        selectionStart === null ||
        selectionEnd === null ||
        selectionDirection === null
      ) {
        log.error(
          'Selection attempted on non-text input element',
          event.target
        );
        return;
      }

      log.debug2(
        'handleSelect',
        selectionStart,
        selectionEnd,
        selectionDirection
      );
      if (
        selection != null &&
        selectionStart === selection.selectionStart &&
        selectionEnd === selection.selectionEnd
      ) {
        return;
      }
      if (selectionStart === selectionEnd) {
        const newSelection = getSegment(selectionStart);
        log.debug(
          'Selection segment from ',
          selectionStart,
          selectionEnd,
          '=>',
          newSelection
        );
        onSelect(newSelection);
      } else {
        onSelect({ selectionStart, selectionEnd, selectionDirection });
      }
    }

    function handleSelectCapture(event: React.UIEvent<HTMLInputElement>) {
      if (!input.current) {
        return;
      }
      log.debug('handleSelectCapture', event);
      const selectionStart = input.current.selectionStart || 0;
      if (
        selectionStart === value.length &&
        selection != null &&
        selectionStart !== selection.selectionStart
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function handleArrowKey(event: React.KeyboardEvent<HTMLInputElement>) {
      event.preventDefault();
      event.stopPropagation();

      if (!input.current) {
        return;
      }

      const { key } = event;
      const { selectionStart = 0, selectionEnd = 0 } = input.current;
      if (selectionStart === null || selectionEnd === null) {
        log.error(
          'Selection arrow nvaigation attempted on non-text input element',
          event.target
        );
        return;
      }

      if (key === 'ArrowLeft') {
        onSelect(previousSegment(selectionStart));
      } else if (key === 'ArrowRight') {
        onSelect(nextSegment(selectionEnd));
      } else if (key === 'ArrowUp') {
        nextSegmentValue(selectionStart, -1);
      } else if (key === 'ArrowDown') {
        nextSegmentValue(selectionStart, 1);
      }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
      if (!input.current) {
        return;
      }
      log.debug('handleKeyDown', event);
      const { key } = event;
      const { selectionStart = 0, selectionEnd = 0 } = input.current;
      if (selectionStart === null || selectionEnd === null) {
        log.error(
          'Selection key event on non-text input element',
          event.target
        );
        return;
      }

      if (key.startsWith('Arrow')) {
        handleArrowKey(event);
        return;
      }

      if (key === 'Delete' || key === 'Backspace') {
        event.preventDefault();
        event.stopPropagation();

        // TODO: trim mask chars on the right before comparison
        if (selectionEnd === value.length) {
          const newValue = value.substring(
            0,
            // Delete whole selection or the char before the cursor
            selectionStart === selectionEnd
              ? selectionStart - 1
              : selectionStart
          );
          // TODO: The char before the cursor is one of the mask chars, delete the mask and the char before
          // TODO: trim ALL mask chars and fixed spaces on the right after deletion
          // if (selectionStart === selectionEnd && ) {
          //   // while mask ... selectionStart > 0
          // }
          if (newValue !== value) {
            onChange(newValue);
            onSelect({
              selectionStart: newValue.length,
              selectionEnd: newValue.length,
              selectionDirection: SELECTION_DIRECTION.NONE,
            });
          }
          return;
        }

        if (selectionStart !== selectionEnd) {
          // Replace all non-masked characters with blanks, set selection to start
          const newValue =
            value.substring(0, selectionStart) +
            value
              .substring(selectionStart, selectionEnd)
              .replace(/[a-zA-Z0-9]/g, FIXED_WIDTH_SPACE) +
            value.substring(selectionEnd);
          log.debug(
            'Range ',
            selectionStart,
            selectionEnd,
            'deleted, setting value',
            newValue
          );

          onChange(newValue);
          onSelect({
            selectionStart,
            selectionEnd: selectionStart,
            selectionDirection: SELECTION_DIRECTION.NONE,
          });
        } else if (selectionStart > 0) {
          for (let i = selectionStart - 1; i >= 0; i -= 1) {
            // Only replace non placeholder text
            const newValue =
              value.substring(0, i) +
              value
                .substring(i, selectionStart)
                .replace(/[a-zA-Z0-9]/g, FIXED_WIDTH_SPACE) +
              value.substring(selectionStart);

            if (newValue !== value) {
              onChange(newValue);
              onSelect({
                selectionStart: i,
                selectionEnd: i,
                selectionDirection: SELECTION_DIRECTION.NONE,
              });
              return;
            }
          }
        }

        return;
      }

      if (event.altKey || event.metaKey || event.ctrlKey || key.length > 1) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      // Get the different permutations of the character they entered, remove duplicates
      const newChars = Array.from(
        new Set([key, key.toUpperCase(), key.toLowerCase()])
      );
      for (let i = 0; i < newChars.length; i += 1) {
        const newChar = newChars[i];

        // If they're typing an alphanumeric character, be smart and allow it to jump ahead
        const maxReplaceIndex = /[a-zA-Z0-9]/g.test(newChar)
          ? example[0].length - 1
          : selectionStart;
        for (
          let replaceIndex = selectionStart;
          replaceIndex <= maxReplaceIndex;
          replaceIndex += 1
        ) {
          // Fill with example chars if necessary
          const filledValue = fillToLength(
            value,
            examples[0],
            replaceIndex + 1
          );
          const newValue = getPreferredReplacementString(
            filledValue,
            replaceIndex,
            newChar,
            selectionStart,
            selectionEnd
          );
          if (isValid(newValue, replaceIndex + 1)) {
            const currentSegment = getSegment(replaceIndex);
            const newSelectionStart = replaceIndex + 1;
            let newSelection: SelectionSegment = {
              selectionStart: newSelectionStart,
              selectionEnd: newSelectionStart,
              selectionDirection: SELECTION_DIRECTION.NONE,
            };
            if (newSelectionStart >= currentSegment.selectionEnd) {
              const nextSegmentSelection = nextSegment(replaceIndex);
              if (
                nextSegmentSelection.selectionStart !==
                currentSegment.selectionStart
              ) {
                newSelection = nextSegmentSelection;
              }
            }
            log.debug('handleKeyDown', key, '=>', newValue, newSelection);
            onChange(newValue);
            onSelect(newSelection);
            return;
          }
        }
      }
    }

    // Need to use "text" type so we can apply a pattern and make selection properly
    return (
      <input
        ref={input}
        className={classNames('form-control masked-input', className)}
        type="text"
        pattern={pattern}
        placeholder={placeholder}
        value={value}
        onChange={() => undefined}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onSelectCapture={handleSelectCapture}
        onFocus={onFocus}
        onBlur={onBlur}
        data-testid={dataTestId}
      />
    );
  }
);

MaskedInput.defaultProps = {
  className: '',
  placeholder: undefined,
  onChange(): void {
    // no-op
  },
  onSelect(): void {
    // no-op
  },
  getNextSegmentValue: (range, delta, segmentValue) => segmentValue,
  getPreferredReplacementString: DEFAULT_GET_PREFERRED_REPLACEMENT_STRING,
  selection: undefined,
  onFocus(): void {
    // no-op
  },
  onBlur(): void {
    // no-op
  },
  'data-testid': undefined,
};

export default MaskedInput;
