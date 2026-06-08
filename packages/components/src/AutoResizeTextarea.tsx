import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';

import './AutoResizeTextarea.scss';

interface AutoResizeTextareaProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  spellCheck?: boolean;
  placeholder?: string;
  disabled?: boolean;
  delimiter?: string;
  id?: string;
  'data-testid'?: string;
}

function implode(input: string): string {
  return input
    .split('\n')
    .map(string => string.trim())
    .filter(string => string) // remove empty strings (e.g. from trailing newlines)
    .join(' ');
}

/**
 * Splits a string on a delimiter, respecting quoted spans.
 * Delimiters that appear inside `"..."` or `'...'` are treated as literal
 * characters and do not cause a split. Quotes are preserved in the returned
 * tokens so the operation is lossless (suitable for display-only transformations
 * where the original text must be recoverable).
 *
 * An unbalanced opening quote (no matching closing quote found ahead) is treated
 * as a literal character and splitting proceeds normally.
 *
 * @param input The string to split.
 * @param delimiter The delimiter to split on.
 * @returns An array of tokens. Always contains at least one element.
 */
function splitOnDelimiter(input: string, delimiter: string): string[] {
  // Walk the string character by character, tracking quoted spans so that
  // delimiters inside "..." or '...' are not treated as split points.
  // Quotes are preserved in the output (not stripped) so the round-trip is lossless.
  // An unbalanced quote is treated as a literal character — splitting continues normally.
  const tokens: string[] = [];
  let current = '';
  let quoteChar: '"' | "'" | null = null;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (quoteChar !== null) {
      // Inside a quoted span — accumulate until we hit the matching closing quote
      current += ch;
      if (ch === quoteChar) {
        quoteChar = null;
      }
      i += 1;
    } else if (ch === '"' || ch === "'") {
      // Only treat as a quoted span if there is a matching closing quote ahead.
      // An unbalanced quote is treated as a literal character so the delimiter
      // logic continues to work normally.
      const closingIdx = input.indexOf(ch, i + 1);
      if (closingIdx !== -1) {
        quoteChar = ch;
      }
      current += ch;
      i += 1;
    } else if (input.startsWith(delimiter, i)) {
      // Delimiter found outside a quoted span — emit the current token and advance
      tokens.push(current);
      current = '';
      i += delimiter.length;
    } else {
      // Plain character outside any quoted span and not part of the delimiter — accumulate it
      current += ch;
      i += 1;
    }
  }

  tokens.push(current);
  return tokens;
}

function explode(input: string, delimiter: string): string {
  // Split by delimiter (commonly " " or " -") respecting quoted spans, then
  // join with newline + trimmed delimiter so each token appears on its own line.
  // Empty tokens (e.g. from multiple consecutive delimiters) are filtered out.
  return splitOnDelimiter(input.trim(), delimiter)
    .filter(token => token !== '') // remove empty strings
    .join(`\n${delimiter.trim()}`);
}

/**
 * Makes a textarea that auto resizes based on contents, its height grows with new lines.
 * If a delimiter is set, such as " -" or " ", as used by jvm args or env vars
 * then the field will also "explode" the value by the delimiter over new lines
 * on focus, and implode on blur. By default, it doesn't word wrap.
 */
function AutoResizeTextarea({
  className = '',
  value: propsValue,
  onChange,
  spellCheck = false,
  placeholder = '',
  disabled = false,
  delimiter = '',
  id = '',
  'data-testid': dataTestId,
}: AutoResizeTextareaProps): JSX.Element {
  const [value, setValue] = useState(propsValue);
  const [isPastedChange, setIsPastedChange] = useState(false);
  const element = useRef<HTMLTextAreaElement>(null);
  const isFocused = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(
    function syncStateWithProp() {
      if (!isFocused.current || !delimiter) {
        // When not focused (or no delimiter), always sync to the new prop value.
        setValue(propsValue);
      } else if (implode(valueRef.current) !== implode(propsValue)) {
        // When focused with delimiter, only update if the imploded value changed to prevent clobbering delimiters
        setValue(explode(propsValue, delimiter));
      }
    },
    [propsValue, delimiter]
  );

  function reCalculateLayout(): void {
    if (!element.current) {
      return;
    }
    element.current.style.height = '0'; // shrink component to get scrollHeight
    const resizedHeight =
      element.current.scrollHeight +
      (element.current.offsetHeight - element.current.clientHeight);
    // accounts for border, padding is captured by scroll height
    if (resizedHeight > 0) element.current.style.height = `${resizedHeight}px`;
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
    let newValue = event.target.value;
    if (isPastedChange) {
      if (delimiter) newValue = explode(newValue, delimiter);
      setIsPastedChange(false);
    }
    setValue(newValue);
    // If there is a delimiter, the onChange value should always be the imploded version
    // to prevent mismatch when exiting without triggering onBlur
    // The exploded version is display only
    onChange(delimiter ? implode(newValue) : newValue);
  }

  function handleFocus(): void {
    if (!element.current) {
      return;
    }
    isFocused.current = true;
    if (delimiter) {
      setValue(explode(value, delimiter));
      reCalculateLayout();
    }
    element.current.scrollLeft = 0;
    // scroll left as it can be disorienting if you click on a long line
  }

  // make it explode when dragging the resize handle
  // by making it trigger focus (which normally doesn't
  // trigger when just resizing).
  function handleMouseDown(): void {
    if (!element.current) return;
    if (document.activeElement === element.current) return;
    element.current.focus();
  }

  function handleBlur(): void {
    isFocused.current = false;
    if (delimiter) {
      setValue(implode(value));
      onChange(implode(value));
    }
  }

  function handlePaste(): void {
    setIsPastedChange(true);
  }

  useEffect(
    function reCalculate() {
      reCalculateLayout();
    },
    [value]
  );

  return (
    <textarea
      ref={element}
      id={id}
      className={classNames(className, 'auto-resize-textarea form-control')}
      placeholder={placeholder}
      value={value}
      rows={1}
      onChange={handleChange}
      onFocus={handleFocus}
      onMouseDown={handleMouseDown}
      onBlur={handleBlur}
      onPaste={handlePaste}
      spellCheck={spellCheck}
      disabled={disabled}
      data-testid={dataTestId}
    />
  );
}

export default AutoResizeTextarea;
