import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

const Button = React.forwardRef((props, ref) => {
  const { children, className, disabled, onClick, style, id } = props;
  return (
    <button
      ref={ref}
      type="button"
      className={classNames('btn', className)}
      onClick={onClick}
      style={style}
      disabled={disabled}
      id={id}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  style: PropTypes.shape({}),
  id: PropTypes.string,
};

Button.defaultProps = {
  children: null,
  className: '',
  disabled: false,
  onClick: () => {},
  style: {},
  id: '',
};

export default Button;
