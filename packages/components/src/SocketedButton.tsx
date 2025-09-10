import React from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSlotProps } from '@react-spectrum/utils';
import { dhExclamation, vsLink } from '@deephaven/icons';

import './SocketedButton.scss';

type SocketedButtonProps = React.PropsWithChildren<{
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
}>;

const SocketedButton = React.forwardRef<HTMLButtonElement, SocketedButtonProps>(
  (props: SocketedButtonProps, ref) => {
    const {
      children,
      className,
      disabled = false,
      id,
      isLinked = false,
      isLinkedSource = false,
      isInvalid = false,
      onClick,
      onMouseEnter,
      onMouseLeave,
      style,
      'data-testid': dataTestId,
    } = props;

    // Spectrum container components such as `ButtonGroup` provide
    // UNSAFE_className prop for the `button` slot via a SlotProvider (
    // https://github.com/adobe/react-spectrum/blob/%40adobe/react-spectrum%403.33.1/packages/%40react-spectrum/buttongroup/src/ButtonGroup.tsx#L104-L107)
    // This can be retrieved via `useSlotProps` to allow our buttons to be styled
    // correctly inside the container.
    const { UNSAFE_className } = useSlotProps<{ UNSAFE_className?: string }>(
      {},
      'button'
    );

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
          className,
          UNSAFE_className
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

export default SocketedButton;
