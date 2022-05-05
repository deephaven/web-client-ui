import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import { useForwardedRef } from '@deephaven/react-hooks';

interface CheckboxProps {
  checked: boolean | null;
  className?: string;
  disabled?: boolean;
  inputClassName?: string;
  isInvalid?: boolean;
  labelClassName?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  children?: React.ReactNode;
  'data-testid'?: string;
}

/**
 * A simple checkbox component. Automatically generates an id so htmlFor/id attributes are unique.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (props, forwardedRef) => {
    const {
      checked = false,
      children,
      className,
      disabled,
      inputClassName,
      isInvalid,
      labelClassName,
      onChange,
      'data-testid': dataTestId,
    } = props;

    const [id] = useState(shortid());

    const ref = useForwardedRef<HTMLInputElement>(forwardedRef);

    useEffect(
      function setIndeterminateProperty() {
        if (ref.current) {
          // indeterminate is not actually an html attr, can only be set via JS
          ref.current.indeterminate = checked === null;
        }
      },
      [ref, checked]
    );

    const handleOnChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
      event => {
        if (ref.current) {
          // ref.current can be null in tests, doesn't impact behaviour
          ref.current.indeterminate = checked === null;
        }

        if (onChange) {
          onChange(event);
        }
      },
      [ref, checked, onChange]
    );

    return (
      <div className={classNames('custom-control custom-checkbox', className)}>
        <input
          type="checkbox"
          ref={ref}
          checked={checked ?? false} // checked attr must always have a value to remain as a controlled component
          className={classNames('custom-control-input', inputClassName, {
            'is-invalid': isInvalid,
          })}
          disabled={disabled}
          id={id}
          onChange={handleOnChange}
          data-testid={dataTestId}
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

// Forward ref causes a false positive for display-name in eslint:
// https://github.com/yannickcr/eslint-plugin-react/issues/2269
Checkbox.displayName = 'Checkbox';

Checkbox.propTypes = {
  /** Current value of the checkbox. */
  checked: (props, propName) => {
    const { [propName]: checkedType } = props;
    if (checkedType !== null && typeof checkedType !== 'boolean') {
      return new Error('Checked must be a boolean or null for indeterminate');
    }
    return null;
  },

  /** The node/text to put in the label of this checkbox */
  children: PropTypes.node.isRequired,

  /** An extra class name to add to the outer div component */
  className: PropTypes.string,

  /** An extra class for disabling the checkbox component */
  disabled: PropTypes.bool,

  /** An extra class name for the input component */
  inputClassName: PropTypes.string,

  /** Convenience for styling appropriately for an invalid value */
  isInvalid: PropTypes.bool,

  /** An extra class name for the label component */
  labelClassName: PropTypes.string,

  /** Triggered when the input is checked/unchecked */
  onChange: PropTypes.func,

  'data-testid': PropTypes.string,
};

Checkbox.defaultProps = {
  checked: false,
  className: '',
  disabled: false,
  inputClassName: '',
  isInvalid: false,
  labelClassName: '',
  onChange: undefined,
  'data-testid': undefined,
};

export default Checkbox;
