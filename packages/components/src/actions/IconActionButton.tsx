/* eslint-disable react/jsx-props-no-spreading */
import {
  ActionButton,
  Icon,
  SpectrumActionButtonProps,
} from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { ACTION_ICON_HEIGHT } from '@deephaven/utils';
import { Tooltip } from '../popper';

export interface IconActionButtonProps
  extends Omit<SpectrumActionButtonProps, 'aria-label' | 'isQuiet' | 'height'> {
  icon: IconProp;
  label: string;
  tooltip?: string;
}

export function IconActionButton({
  icon,
  label,
  tooltip,
  ...props
}: IconActionButtonProps): JSX.Element {
  return (
    <ActionButton
      {...props}
      aria-label={label}
      isQuiet
      height={ACTION_ICON_HEIGHT}
    >
      <Icon
        UNSAFE_className={
          tooltip == null ? undefined : 'action-button-icon-with-tooltip'
        }
      >
        <FontAwesomeIcon icon={icon} />
      </Icon>
      {tooltip == null ? null : <Tooltip>{tooltip}</Tooltip>}
    </ActionButton>
  );
}
IconActionButton.displayName = 'IconActionButton';

export default IconActionButton;
