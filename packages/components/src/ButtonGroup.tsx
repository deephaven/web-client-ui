import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

interface ButtonGroupProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const ButtonGroup = (props: ButtonGroupProps): JSX.Element => {
  const { children, className, style } = props;

  return (
    <div
      className={classNames('btn-group', className)}
      style={style}
      role="group"
    >
      {children}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';

ButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
};

ButtonGroup.defaultProps = {
  className: null,
  style: {},
};

export default ButtonGroup;
