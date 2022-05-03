import React from 'react';
import classNames from 'classnames';
import './UISwitch.scss';

export type UISwitchProps = {
  on: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  id?: string;
  className?: string;
  isInvalid?: boolean;
  disabled?: boolean;
  'data-testid'?: string;
};

const UISwitch = ({
  on,
  id,
  className,
  isInvalid,
  disabled = false,
  onClick,
  'data-testid': dataTestId,
}: UISwitchProps): JSX.Element => (
  <button
    type="button"
    className={classNames(
      'btn',
      'btn-switch',
      className,
      { active: on },
      { 'is-invalid': isInvalid }
    )}
    id={id}
    onClick={onClick}
    disabled={disabled}
    data-testid={dataTestId}
  >
    <div className="handle" />
  </button>
);

export default UISwitch;
