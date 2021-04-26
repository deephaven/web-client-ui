import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './AutoResizeTextarea.scss';

/**
 * Makes a textarea that auto resizes based on contents, its height grows with new lines.
 * If a delimeter is set, such as " -" or " ", as used by jvm args or env vars
 * then the field will also "explode" the value by the delimiter over new lines
 * on focus, and implode on blur. By default, it doesn't word wrap.
 */
const AutoResizeTextarea = props => {
  const {
    className,
    value: propsValue,
    onChange,
    spellCheck,
    placeholder,
    disabled,
    delimiter,
    id,
  } = props;

  const [value, setValue] = useState(propsValue);
  const [isPastedChange, setIsPastedChange] = useState(false);
  const element = useRef(null);

  useEffect(() => {
    // keep state value in sync with prop changes
    setValue(propsValue);
  }, [propsValue]);

  function explode(input) {
    // split by delimiter, commonly " " or " -"
    // strip empty strings (if delimiter is space, and there are multiple spaces in a row)
    // and join with new line and a trimmed delimeter (get rid of leading spaces)
    return input
      .trim()
      .split(delimiter)
      .filter(string => string) // remove empty strings
      .join(`\n${delimiter.trim()}`);
  }

  function implode(input) {
    return input
      .split('\n')
      .map(string => string.trim())
      .join(' ');
  }

  function reCalculateLayout() {
    element.current.style.height = 'auto'; // needed to allow component to shrink
    const resizedHeight =
      element.current.scrollHeight +
      (element.current.offsetHeight - element.current.clientHeight);
    // accounts for border, padding is captured by scroll height
    if (resizedHeight > 0) element.current.style.height = `${resizedHeight}px`;
  }

  function handleChange(event) {
    let newValue = event.target.value;
    if (isPastedChange) {
      if (delimiter) newValue = explode(newValue);
      setIsPastedChange(false);
    }
    setValue(newValue);
    onChange(newValue);
  }

  function handleFocus() {
    if (delimiter) {
      setValue(explode(value));
      reCalculateLayout();
    }
    element.current.scrollLeft = 0;
    // scroll left as it can be disorienting if you click on a long line
  }

  function handleBlur() {
    if (delimiter) {
      setValue(implode(value));
      onChange(implode(value));
    }
  }

  function handlePaste() {
    setIsPastedChange(true);
  }

  useEffect(() => {
    reCalculateLayout();
  }, [value]);

  return (
    <textarea
      ref={element}
      id={id}
      className={classNames(className, 'auto-resize-textarea form-control')}
      placeholder={placeholder}
      value={value}
      rows="1"
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPaste={handlePaste}
      spellCheck={spellCheck}
      disabled={disabled}
    />
  );
};

AutoResizeTextarea.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  spellCheck: PropTypes.bool,
  disabled: PropTypes.bool,
  delimiter: PropTypes.string,
  id: PropTypes.string,
};

AutoResizeTextarea.defaultProps = {
  className: '',
  id: '',
  placeholder: '',
  disabled: false,
  spellCheck: false,
  delimiter: '',
};

export default AutoResizeTextarea;
