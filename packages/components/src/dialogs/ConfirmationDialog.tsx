/* eslint-disable react/jsx-props-no-spreading */
import { ReactElement, ReactNode } from 'react';
import {
  Button,
  ButtonGroup,
  Content,
  Dialog,
  Divider,
  Form,
  Heading,
} from '@adobe/react-spectrum';
import type { SpectrumLabelableProps } from '@react-types/shared';
import { useFormWithDetachedSubmitButton } from '@deephaven/react-hooks';
import styles from '../SpectrumComponent.module.scss';

export interface ConfirmationDialogProps {
  heading: ReactNode;
  confirmationButtonLabel: string;
  children:
    | ReactElement<SpectrumLabelableProps>
    | ReactElement<SpectrumLabelableProps>[];
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmationDialog({
  heading,
  confirmationButtonLabel,
  children,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps): JSX.Element {
  const { formProps, submitButtonProps } = useFormWithDetachedSubmitButton();

  return (
    <Dialog>
      <Heading
        level={3}
        UNSAFE_className={styles.spectrumDialogComponentHeading}
      >
        {heading}
      </Heading>
      <Divider />
      <Content>
        <Form
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...formProps}
        >
          {children}
        </Form>
      </Content>
      <ButtonGroup>
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button
          {...submitButtonProps}
          // eslint-disable-next-line react/style-prop-object
          style="fill"
          variant="negative"
          onPress={onConfirm}
          type="submit"
        >
          {confirmationButtonLabel}
        </Button>
      </ButtonGroup>
    </Dialog>
  );
}

export default ConfirmationDialog;
