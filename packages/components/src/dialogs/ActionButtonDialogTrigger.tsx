import { ReactElement } from 'react';
import type { SpectrumDialogClose } from '@react-types/dialog';
import type { StyleProps } from '@react-types/shared';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionButton, DialogTrigger, Icon, Text } from '../spectrum';
import { Tooltip } from '../popper';

export interface ActionButtonDialogTriggerProps extends StyleProps {
  icon: IconDefinition;
  isQuiet?: boolean;
  labelText?: string;
  ariaLabel?: string;
  tooltip?: string;
  children: SpectrumDialogClose | ReactElement;
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * Dialog trigger based on an ActionButton.
 */
export function ActionButtonDialogTrigger({
  ariaLabel,
  icon,
  isQuiet,
  labelText,
  children,
  onOpenChange,
  tooltip,
  ...styleProps
}: ActionButtonDialogTriggerProps): JSX.Element {
  const iconClassName =
    labelText == null && tooltip != null
      ? 'action-button-icon-with-tooltip'
      : undefined;

  return (
    <DialogTrigger type="popover" onOpenChange={onOpenChange}>
      <ActionButton
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...styleProps}
        aria-label={ariaLabel ?? labelText}
        isQuiet={isQuiet}
      >
        <Icon UNSAFE_className={iconClassName}>
          <FontAwesomeIcon icon={icon} />
        </Icon>
        {labelText == null ? null : <Text>{labelText}</Text>}
        {tooltip == null ? null : <Tooltip>{tooltip}</Tooltip>}
      </ActionButton>
      {children}
    </DialogTrigger>
  );
}

export default ActionButtonDialogTrigger;
