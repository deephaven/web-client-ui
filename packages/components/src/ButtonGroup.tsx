import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';

interface ButtonGroupProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}

const ButtonGroup = (props: ButtonGroupProps): JSX.Element => {
  const { children, className, style, 'data-testid': dataTestId } = props;

  return (
    <div
      className={classNames('btn-group', className)}
      style={style}
      role="group"
      data-testid={dataTestId}
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
  'data-testid': PropTypes.string,
};

ButtonGroup.defaultProps = {
  className: null,
  style: {},
  'data-testid': undefined,
};

export default ButtonGroup;
