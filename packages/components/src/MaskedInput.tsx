import React, { useMemo, useEffect } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Log from '@deephaven/log';
import { useForwardedRef } from '@deephaven/react-hooks';
import './MaskedInput.scss';

const log = Log.module('MaskedInput');

const SELECTION_DIRECTION = Object.freeze({
  FORWARD: 'forward',
  BACKWARD: 'backward',
  NONE: 'none',
});

/**
 * Special space character that's the same size as tabular numbers
 * https://www.fileformat.info/info/unicode/char/2007/index.htm
 */
const FIXED_WIDTH_SPACE = '\u2007';

/**
 * A masked input for entering data from a template.
 * Won't work by itself, must use within another component and handle updating the value/selection.
 */
// Forward ref causes a false positive for display-name in eslint:
// https://github.com/yannickcr/eslint-plugin-react/issues/2269
// eslint-disable-next-line react/display-name
const MaskedInput = React.forwardRef((props, ref) => {
  const {
    className,
    example,
    getNextSegmentValue,
    onChange,
    onSelect,
    pattern,
    selection,
    value,
    onFocus,
    onBlur,
  } = props;
  const input = useForwardedRef(ref);
  const examples = useMemo(() => [].concat(example), [example]);

  useEffect(() => {
    if (selection != null) {
      log.debug('setting selection...', selection);
      const { selectionStart, selectionEnd, selectionDirection } = selection;
      input.current.setSelectionRange(
        selectionStart,
        selectionEnd,
        selectionDirection
      );
      log.debug('selection set!');
    }
  }, [selection, input]);

  /**
   * Returns the selection range for the segment at the given cursor position
   * @param {number} cursorPosition The current position of the cursor
   */
  function getSegment(cursorPosition) {
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
   * @param {string} checkValue The value to check/fill in
   * @param {string} exampleValue The example to fill in the value from
   * @param {number} cursorPosition The cursor position
   * @returns {string} The filled in value
   */
  function fillValue(
    checkValue,
    exampleValue,
    cursorPosition = checkValue.length
  ) {
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
   * @param {string} checkValue The value to check validity of
   * @param {number} cursorPosition The position of the cursor to check up to
   */
  function isValid(checkValue, cursorPosition = checkValue.length) {
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
   * @param {number} position The cursor position to start at
   * @returns {object} The new selection range
   */
  function nextSegment(position) {
    const currentSegment = getSegment(position);
    const nextPosition = currentSegment.selectionEnd + 1;
    if (nextPosition >= value.length) {
      return currentSegment;
    }

    return getSegment(nextPosition);
  }

  /**
   * Returns the previous segment before the given position
   * @param {number} position The cursor position to start at
   * @returns {object} The new selection range
   */
  function previousSegment(position) {
    const currentSegment = getSegment(position);
    const previousPosition = currentSegment.selectionStart - 1;
    if (previousPosition <= 0) {
      return currentSegment;
    }

    return getSegment(previousPosition);
  }

  function nextSegmentValue(position, delta) {
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

  function handleChange(event) {
    // All changes are handled in `handleKeyDown`
    // Need to add an `onChange` handler to appease linter
    log.debug('Change event', event);
  }

  function handleSelect(event) {
    const { selectionStart, selectionEnd, selectionDirection } = event.target;
    log.debug2(
      'handleSelect',
      selectionStart,
      selectionEnd,
      selectionDirection
    );
    if (
      selection !== null &&
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

  function handleSelectCapture(event) {
    log.debug('handleSelectCapture', event);
    const { selectionStart } = input.current;
    if (
      selectionStart === value.length &&
      selection != null &&
      selectionStart !== selection.selectionStart
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function handleArrowKey(event) {
    event.preventDefault();
    event.stopPropagation();

    const { key } = event;
    const { selectionStart, selectionEnd } = input.current;
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

  function handleKeyDown(event) {
    log.debug('handleKeyDown', event);
    const { key } = event;
    const { selectionStart, selectionEnd } = input.current;
    if (key.startsWith('Arrow')) {
      handleArrowKey(event);
      return;
    }

    if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault();
      event.stopPropagation();

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
        ? value.length - 1
        : selectionStart;
      for (
        let replaceIndex = selectionStart;
        replaceIndex <= maxReplaceIndex;
        replaceIndex += 1
      ) {
        const newValue =
          value.substring(0, replaceIndex) +
          newChar +
          value.substring(replaceIndex + 1);
        if (isValid(newValue, replaceIndex + 1)) {
          const currentSegment = getSegment(replaceIndex);
          const newSelectionStart = replaceIndex + 1;
          let newSelection = {
            selectionStart: newSelectionStart,
            selectionEnd: newSelectionStart,
            selectionDirection: SELECTION_DIRECTION.NONE,
          };
          if (newSelectionStart >= currentSegment.selectionEnd) {
            const nextSegmentSelection = nextSegment(replaceIndex);
            if (nextSegment.selectionStart !== currentSegment.selectionStart) {
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
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onSelect={handleSelect}
      onSelectCapture={handleSelectCapture}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
});

MaskedInput.propTypes = {
  /** An extra class name to add to the component */
  className: PropTypes.string,
  /** The regex pattern this masked input must match */
  pattern: PropTypes.string.isRequired,
  /** The current value to display */
  value: PropTypes.string.isRequired,
  /** One or more examples of valid values. Used when deciding if next keystroke is valid (as rest of the current value may be incomplete) */
  example: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]).isRequired,
  /** The current selection to use for the input */
  selection: PropTypes.shape({
    selectionStart: PropTypes.number.isRequired,
    selectionEnd: PropTypes.number.isRequired,
    selectionDirection: PropTypes.string,
  }),
  /** Called when the value changes. Note the value may still be incomplete. */
  onChange: PropTypes.func,
  /** Called when  selection changes */
  onSelect: PropTypes.func,
  /** Retrieve the next value for a provided segment */
  getNextSegmentValue: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

MaskedInput.defaultProps = {
  className: '',
  selection: null,
  onChange: () => {},
  onSelect: () => {},
  getNextSegmentValue: (range, delta, segmentValue) => segmentValue,
  onFocus: () => {},
  onBlur: () => {},
};

export default MaskedInput;
