import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './UISwitch.scss';

const UISwitch = props => {
  const { on, id, className, isInvalid, disabled, onClick } = props;
  return (
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
};

UISwitch.propTypes = {
  on: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  id: PropTypes.string,
  className: PropTypes.string,
  isInvalid: PropTypes.bool,
  disabled: PropTypes.bool,
};

UISwitch.defaultProps = {
  id: null,
  className: null,
  isInvalid: false,
  disabled: false,
};

export default UISwitch;
