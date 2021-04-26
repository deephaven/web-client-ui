import React, { useState } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import shortid from 'shortid';

/**
 * A RadioItem to be used within the Radio component.
 */
const RadioItem = React.forwardRef((props, ref) => {
  const {
    checked,
    children,
    className,
    disabled,
    inputClassName,
    isInvalid,
    labelClassName,
    name,
    onChange,
    value,
  } = props;

  const [id] = useState(shortid());

  return (
    <div className={classNames('custom-control custom-radio', className)}>
      <input
        type="radio"
        id={id}
        name={name}
        ref={ref}
        className={classNames('custom-control-input', inputClassName, {
          'is-invalid': isInvalid,
        })}
        checked={checked}
        disabled={disabled}
        value={value}
        onChange={onChange}
      />
      <label
        className={classNames('custom-control-label', labelClassName)}
        htmlFor={id}
      >
        {children}
      </label>
    </div>
  );
});

RadioItem.displayName = 'RadioItem';

RadioItem.propTypes = {
  /** Whether this value is currently checked or not */
  checked: PropTypes.bool,

  /** The node/text to put in the label of this radio item */
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,

  /** An extra class name to add to the outer div component */
  className: PropTypes.string,

  /** An extra class for disabling the radio button component */
  disabled: PropTypes.bool,

  /** An extra class name for the input component */
  inputClassName: PropTypes.string,

  /** The value is invalid, style to show it's invalid */
  isInvalid: PropTypes.bool,

  /** An extra class name for the label component */
  labelClassName: PropTypes.string,

  /** The name for this RadioItem. Should be specified by the parent Radio component */
  name: PropTypes.string,

  /** Triggered when the input is checked/unchecked. Provided by the parent Radio component. */
  onChange: PropTypes.func,

  /** The value to associate with this radio item */
  value: PropTypes.string.isRequired,
};

RadioItem.defaultProps = {
  checked: undefined,
  className: '',
  disabled: false,
  inputClassName: '',
  isInvalid: false,
  labelClassName: '',
  name: null,
  onChange: null,
};

export default RadioItem;
