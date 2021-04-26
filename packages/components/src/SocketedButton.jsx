import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { dhExclamation, vsLink } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './SocketedButton.scss';

const SocketedButton = React.forwardRef((props, ref) => {
  const {
    children,
    className,
    disabled,
    isLinked,
    isLinkedSource,
    isInvalid,
    onClick,
    onMouseEnter,
    onMouseLeave,
    style,
  } = props;
  return (
    <button
      ref={ref}
      type="button"
      className={classNames(
        'btn-socketed',
        { 'btn-socketed-linked': isLinked || isLinkedSource },
        { 'btn-socketed-linked-source': isLinkedSource },
        { 'is-invalid': isInvalid },
        className
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
      disabled={disabled}
    >
      {children}
      <FontAwesomeIcon
        icon={vsLink}
        className="linked btn-socketed-icon"
        transform="down-1"
      />
      <FontAwesomeIcon
        icon={dhExclamation}
        className="is-invalid btn-socketed-icon"
      />
    </button>
  );
});

SocketedButton.displayName = 'SocketedButton';

SocketedButton.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  isLinked: PropTypes.bool,
  isLinkedSource: PropTypes.bool,
  isInvalid: PropTypes.bool,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  style: PropTypes.shape({}),
};

SocketedButton.defaultProps = {
  children: null,
  className: '',
  disabled: false,
  isLinked: false,
  isLinkedSource: false,
  isInvalid: false,
  onClick: () => {},
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  style: {},
};

export default SocketedButton;
