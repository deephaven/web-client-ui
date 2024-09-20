/* eslint-disable react/jsx-props-no-spreading */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { ActionButton, Icon, type ActionButtonProps } from '../spectrum';
import { Tooltip } from '../popper';
import { ACTION_ICON_HEIGHT } from '../UIConstants';

export interface IconActionButtonProps
  extends Omit<ActionButtonProps, 'aria-label' | 'isQuiet' | 'height'> {
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
