import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { nanoid } from 'nanoid';
import { useForwardedRef } from '@deephaven/react-hooks';

interface CheckboxProps {
  checked: boolean | null;
  className?: string;
  disabled?: boolean;
  inputClassName?: string;
  isInvalid?: boolean;
  labelClassName?: string;
  name?: string;
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
      disabled = false,
      inputClassName,
      isInvalid = false,
      labelClassName,
      name,
      onChange,
      'data-testid': dataTestId,
    } = props;

    const [id] = useState(nanoid());

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

    const handleOnChange: React.ChangeEventHandler<HTMLInputElement> =
      useCallback(
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
          name={name}
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

export default Checkbox;
