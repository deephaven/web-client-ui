import React from 'react';
import classNames from 'classnames';
import { dhExclamation, vsLink } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import './SocketedButton.scss';

type SocketedButtonProps = {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  isLinked?: boolean;
  isLinkedSource?: boolean;
  isInvalid?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
  style?: React.CSSProperties;
  'data-testid'?: string;
};

const SocketedButton = React.forwardRef<HTMLButtonElement, SocketedButtonProps>(
  (props: SocketedButtonProps, ref) => {
    const {
      children,
      className,
      disabled,
      id,
      isLinked,
      isLinkedSource,
      isInvalid,
      onClick,
      onMouseEnter,
      onMouseLeave,
      style,
      'data-testid': dataTestId,
    } = props;
    return (
      <button
        ref={ref}
        type="button"
        className={classNames(
          'btn-socketed',
          {
            'btn-socketed-linked':
              (isLinked !== undefined && isLinked) || isLinkedSource,
          },
          { 'btn-socketed-linked-source': isLinkedSource },
          { 'is-invalid': isInvalid },
          className
        )}
        id={id}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={style}
        disabled={disabled}
        data-testid={dataTestId}
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
  }
);

SocketedButton.displayName = 'SocketedButton';

SocketedButton.defaultProps = {
  children: undefined,
  className: '',
  disabled: false,
  id: undefined,
  isLinked: false,
  isLinkedSource: false,
  isInvalid: false,
  onClick: undefined,
  onMouseEnter: undefined,
  onMouseLeave: undefined,
  style: undefined,
  'data-testid': undefined,
};

export default SocketedButton;
