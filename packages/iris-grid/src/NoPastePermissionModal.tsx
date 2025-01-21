import {
  Button,
  GLOBAL_SHORTCUTS,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@deephaven/components';

export type NoPastePermissionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
};

export function NoPastePermissionModal({
  isOpen,
  onClose,
  errorMessage,
}: NoPastePermissionModalProps): JSX.Element {
  const pasteShortcutText = GLOBAL_SHORTCUTS.PASTE.getDisplayText();
  return (
    <Modal isOpen={isOpen} toggle={onClose} centered>
      <ModalHeader closeButton={false}>No Paste Permission</ModalHeader>
      <ModalBody>
        <p>{errorMessage}</p>
        <p>You can still use {pasteShortcutText} to paste.</p>
      </ModalBody>
      <ModalFooter>
        <Button kind="primary" onClick={onClose}>
          Dismiss
        </Button>
      </ModalFooter>
    </Modal>
  );
}
