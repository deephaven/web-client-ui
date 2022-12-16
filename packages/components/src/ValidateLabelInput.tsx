import React, { useRef } from 'react';
import classNames from 'classnames';
import shortid from 'shortid';
import './ValidateLabelInput.scss';

export type ValidateLabelInputProps = {
  /** Element to add label to */
  children: React.ReactNode;

  /** Any classnames to add */
  className?: string | string[];

  /** Text for this validation label */
  labelText?: string;

  /** Small hint text next to the main label */
  hintText?: string;

  /** Show a modified state. Defaults to false. */
  isModified?: boolean;

  /** Validation error that has occurred */
  validationError?: string;

  /** Show the validation error if it exists. Default to true. */
  showValidationError?: boolean;

  /** ID to use. Auto-generates if not provided */
  id?: string;

  /** data-testid to apply to the label */
  'data-testid'?: string;
};

/**
 * Takes a child and add a label and validaton error
 */
export function ValidateLabelInput(
  props: ValidateLabelInputProps
): React.ReactElement {
  const {
    children,
    className,
    labelText,
    hintText,
    isModified,
    validationError,
    showValidationError = true,
    'data-testid': dataTestId,
    id: idProp,
  } = props;

  const { current: id } = useRef(idProp ?? shortid());

  return (
    <>
      <label
        className={classNames('validate-label', className, {
          modified: isModified,
        })}
        htmlFor={id}
        data-testid={dataTestId}
      >
        {labelText}
      </label>
      {React.Children.toArray(children).map(child => {
        if (!React.isValidElement<React.HTMLAttributes<HTMLElement>>(child)) {
          // eslint-disable-next-line react/jsx-key
          return <div className={classNames(className)}>{child}</div>;
        }

        // toArray strips null children
        return React.cloneElement(child, {
          className: classNames(child.props.className, {
            'is-invalid': validationError,
          }),
        });
      })}
      {hintText !== undefined && (
        <small className="form-text text-muted">{hintText}</small>
      )}
      {validationError !== undefined && showValidationError && (
        <p className="validate-label-error text-danger">{validationError}</p>
      )}
    </>
  );
}

export default ValidateLabelInput;
