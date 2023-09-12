import { ReactElement } from 'react';
import { ActionButton, DialogTrigger, Icon, Text } from '@adobe/react-spectrum';
import type { SpectrumDialogClose } from '@react-types/dialog';
import type { StyleProps } from '@react-types/shared';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface ActionButtonDialogTriggerProps extends StyleProps {
  icon: IconDefinition;
  isQuiet?: boolean;
  labelText?: string;
  ariaLabel?: string;
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
  ...styleProps
}: ActionButtonDialogTriggerProps): JSX.Element {
  return (
    <DialogTrigger type="popover" onOpenChange={onOpenChange}>
      <ActionButton
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...styleProps}
        aria-label={ariaLabel ?? labelText}
        isQuiet={isQuiet}
      >
        <Icon>
          <FontAwesomeIcon icon={icon} />
        </Icon>
        {labelText == null ? null : <Text>{labelText}</Text>}
      </ActionButton>
      {children}
    </DialogTrigger>
  );
}

export default ActionButtonDialogTrigger;
