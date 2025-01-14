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
  handleClose: () => void;
};

export function NoPastePermissionModal({
  isOpen,
  handleClose,
}: NoPastePermissionModalProps): JSX.Element {
  const pasteShortcutText = GLOBAL_SHORTCUTS.PASTE.getDisplayText();
  return (
    <Modal isOpen={isOpen} toggle={handleClose} centered>
      <ModalHeader closeButton={false}>No Paste Permission</ModalHeader>
      <ModalBody>
        <p>
          For security reasons your browser does not allow access to your
          clipboard on click, or requested clipboard permissions have been
          denied.
        </p>
        <p>You can still use {pasteShortcutText} to paste.</p>
      </ModalBody>
      <ModalFooter>
        <Button kind="primary" onClick={handleClose}>
          Okay
        </Button>
      </ModalFooter>
    </Modal>
  );
}
