import React, { useRef } from 'react';
import classNames from 'classnames';
import shortid from 'shortid';
import { Tooltip } from '@deephaven/components';
import { vsQuestion } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface ValidateLabelInputProps {
  /** Element to add label to */
  children: React.ReactNode;

  /** Any classnames to add to the label and the children */
  className?: string | string[];

  /** Any classnames to add to the label */
  labelClassName?: string | string[];

  /** Text for this validation label */
  labelText?: string;

  /** Small hint text next to the main label */
  hintText?: string;

  /** Text to show in a tooltip */
  tooltipText?: string;

  /** Show a modified state. Defaults to false. */
  isModified?: boolean;

  /** Show a required state. Defaults to false. */
  isRequired?: boolean;

  /** Validation error that has occurred */
  validationError?: string;

  /** Show the validation error if it exists. Default to true. */
  showValidationError?: boolean;

  /** ID to use. Auto-generates if not provided */
  id?: string;

  /** data-testid to apply to the label */
  'data-testid'?: string;
}

/**
 * Takes a child and adds a label and validation error
 */
function ValidateLabelInput(
  props: ValidateLabelInputProps
): React.ReactElement {
  const {
    children,
    className,
    labelClassName,
    labelText,
    hintText,
    tooltipText,
    isModified,
    isRequired,
    validationError,
    showValidationError = true,
    'data-testid': dataTestId,
    id: idProp,
  } = props;

  const { current: id } = useRef(idProp ?? shortid());

  return (
    <>
      <label
        className={classNames('validate-label', labelClassName, className, {
          modified: isModified,
        })}
        htmlFor={id}
        data-testid={dataTestId}
      >
        {labelText}
        {tooltipText && (
          <>
            <FontAwesomeIcon icon={vsQuestion} className="fa-fw text-muted" />
            <Tooltip>{tooltipText}</Tooltip>
          </>
        )}
        {isRequired && <span className="text-muted small pl-1">*required</span>}
      </label>
      {React.Children.toArray(children).map(child => {
        const isDOMElement =
          React.isValidElement(child) && typeof child.type === 'string';
        const childProps = isDOMElement
          ? {}
          : { isInvalid: Boolean(validationError) };
        // toArray strips null children
        // casting since TS cannot recognize child cannot be {}
        return React.cloneElement(child as React.ReactElement, {
          className: classNames((child as React.ReactElement).props.className, {
            'is-invalid': validationError,
          }),
          ...childProps,
          id,
        });
      })}
      {hintText && <small className="form-text text-muted">{hintText}</small>}
      {validationError && showValidationError && (
        <p className="form-text text-danger">{validationError}</p>
      )}
    </>
  );
}

export default ValidateLabelInput;
