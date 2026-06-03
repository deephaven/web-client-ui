import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
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

function explode(input: string, delimiter: string): string {
  // split by delimiter, commonly " " or " -"
  // strip empty strings (if delimiter is space, and there are multiple spaces in a row)
  // and join with new line and a trimmed delimiter (get rid of leading spaces)
  return input
    .trim()
    .split(delimiter)
    .filter(string => string) // remove empty strings
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

AutoResizeTextarea.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  spellCheck: PropTypes.bool,
  disabled: PropTypes.bool,
  delimiter: PropTypes.string,
  id: PropTypes.string,
  'data-testid': PropTypes.string,
};

AutoResizeTextarea.defaultProps = {
  className: '',
  id: '',
  placeholder: '',
  disabled: false,
  spellCheck: false,
  delimiter: '',
  'data-testid': undefined,
};

export default AutoResizeTextarea;
