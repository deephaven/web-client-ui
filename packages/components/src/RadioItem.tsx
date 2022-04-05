import React, { useState } from 'react';
import classNames from 'classnames';
import shortid from 'shortid';

type RadioItemProps = {
  /** Whether this value is currently checked or not */
  checked?: boolean;

  /** The node/text to put in the label of this radio item */
  children: React.ReactNode;

  /** An extra class name to add to the outer div component */
  className?: string;

  /** An extra class for disabling the radio button component */
  disabled?: boolean;

  /** An extra class name for the input component */
  inputClassName?: string;

  /** The value is invalid, style to show it's invalid */
  isInvalid?: boolean;

  /** An extra class name for the label component */
  labelClassName?: string;

  /** The name for this RadioItem. Should be specified by the parent Radio component */
  name?: string;

  /** Triggered when the input is checked/unchecked. Provided by the parent Radio component. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;

  /** The value to associate with this radio item */
  value: string;

  /** An id used for test */
  'data-testid'?: string;
};

/**
 * A RadioItem to be used within the Radio component.
 */
const RadioItem = React.forwardRef<HTMLInputElement, RadioItemProps>(
  (props: RadioItemProps, ref) => {
    const {
      checked,
      children,
      className = '',
      disabled = false,
      inputClassName = '',
      isInvalid = false,
      labelClassName = '',
      name,
      onChange,
      value,
      'data-testid': dataTestId,
    } = props;

    const [id] = useState(shortid());

    return (
      <div className={classNames('custom-control custom-radio', className)}>
        <input
          type="radio"
          id={id}
          data-testid={dataTestId}
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
  }
);

RadioItem.displayName = 'RadioItem';

RadioItem.defaultProps = {
  checked: undefined,
  className: '',
  disabled: false,
  inputClassName: '',
  isInvalid: false,
  labelClassName: '',
  name: undefined,
  onChange: undefined,
  'data-testid': undefined,
};

export default RadioItem;
