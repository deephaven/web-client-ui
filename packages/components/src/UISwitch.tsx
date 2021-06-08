import React from 'react';
import classNames from 'classnames';
import './UISwitch.scss';

type UISwitchProps = {
  on: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  id?: string;
  className?: string;
  isInvalid?: boolean;
  disabled?: boolean;
};

const UISwitch = ({
  on,
  id,
  className,
  isInvalid,
  disabled = false,
  onClick,
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
  >
    <div className="handle" />
  </button>
);

export default UISwitch;
