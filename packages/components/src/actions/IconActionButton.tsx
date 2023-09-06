/* eslint-disable react/jsx-props-no-spreading */
import {
  ActionButton,
  Icon,
  SpectrumActionButtonProps,
} from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { ACTION_ICON_HEIGHT } from '@deephaven/utils';

export interface IconActionButtonProps
  extends Omit<SpectrumActionButtonProps, 'aria-label' | 'isQuiet' | 'height'> {
  icon: IconProp;
  label: string;
}

export function IconActionButton({
  icon,
  label,
  ...props
}: IconActionButtonProps) {
  return (
    <ActionButton
      {...props}
      aria-label={label}
      isQuiet
      height={ACTION_ICON_HEIGHT}
    >
      <Icon>
        <FontAwesomeIcon icon={icon} />
      </Icon>
    </ActionButton>
  );
}
IconActionButton.displayName = 'IconActionButton';

export default IconActionButton;
