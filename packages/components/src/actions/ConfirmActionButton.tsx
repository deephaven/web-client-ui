import { type ReactElement, type ReactNode, useCallback } from 'react';
import type { SpectrumLabelableProps } from '@react-types/shared';
import { vsTrash } from '@deephaven/icons';
import { ActionButtonDialogTrigger, ConfirmationDialog } from '../dialogs';
import { ACTION_ICON_HEIGHT } from '../UIConstants';

export interface ConfirmActionButtonProps {
  ariaLabel: string;
  heading: ReactNode;
  confirmationButtonLabel: string;
  children:
    | ReactElement<SpectrumLabelableProps>
    | ReactElement<SpectrumLabelableProps>[];
  isHidden?: boolean;
  tooltip?: string;
  onConfirm: () => void;
}

export function ConfirmActionButton({
  ariaLabel,
  heading,
  confirmationButtonLabel,
  isHidden,
  children,
  tooltip,
  onConfirm,
}: ConfirmActionButtonProps): JSX.Element {
  const renderDialog = useCallback(
    close => (
      <ConfirmationDialog
        heading={heading}
        confirmationButtonLabel={confirmationButtonLabel}
        onCancel={close}
        onConfirm={() => {
          close();
          onConfirm();
        }}
      >
        {children}
      </ConfirmationDialog>
    ),
    [children, confirmationButtonLabel, heading, onConfirm]
  );

  return (
    <ActionButtonDialogTrigger
      ariaLabel={ariaLabel}
      icon={vsTrash}
      isHidden={isHidden}
      isQuiet
      height={ACTION_ICON_HEIGHT}
      tooltip={tooltip}
    >
      {renderDialog}
    </ActionButtonDialogTrigger>
  );
}

export default ConfirmActionButton;
