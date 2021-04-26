import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import shortid from 'shortid';

/**
 * A simple checkbox component. Automatically generates an id so htmlFor/id attributes are unique.
 */
const Checkbox = React.forwardRef((props, forwardedRef) => {
  const {
    checked,
    children,
    className,
    disabled,
    inputClassName,
    isInvalid,
    labelClassName,
    onChange,
  } = props;

  const [id] = useState(shortid());

  const ref = useRef();
  // using to expose local ref as forwarded ref
  useImperativeHandle(forwardedRef, () => ref.current);

  useEffect(() => {
    // indeterminate is not actually an html attr, can only be set via JS
    ref.current.indeterminate = checked === null;
  }, [checked]);

  const handleOnChange = useCallback(
    event => {
      if (ref?.current) {
        // ref.current can be null in tests, doesn't impact behaviour
        ref.current.indeterminate = checked === null;
      }
      onChange(event);
    },
    [checked, onChange]
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

// Forward ref causes a false positive for display-name in eslint:
// https://github.com/yannickcr/eslint-plugin-react/issues/2269
Checkbox.displayName = 'Checkbox';

Checkbox.propTypes = {
  /** Current value of the checkbox. */
  checked: (props, propName) =>
    props[propName] === null ? null : PropTypes.boolean,

  /** The node/text to put in the label of this checkbox */
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,

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
};

Checkbox.defaultProps = {
  checked: false,
  className: '',
  disabled: false,
  inputClassName: '',
  isInvalid: false,
  labelClassName: '',
  onChange: () => {},
};

export default Checkbox;
