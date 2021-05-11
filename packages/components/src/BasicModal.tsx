import React, { useRef, useCallback } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import PropTypes from 'prop-types';
import ButtonGroup from './ButtonGroup';
import Button from './Button';

interface BasicModalProps {
  isOpen: boolean;
  headerText: string;
  bodyText: string | (() => string);
  onCancel?: () => void;
  onConfirm: () => void;
  onDiscard?: () => void;
  onModalDisable?: () => void;
  cancelButtonText?: string;
  confirmButtonText?: string;
  discardButtonText?: string;
  children?: React.ReactNode;
}

/**
 * A basic modal dialog with two buttons: cancel / confirm.
 *
 * @param isOpen indicates if the modal dialog is open
 * @param headerText text displayed in the modal header
 * @param bodyText text displayed in the modal body
 * @param onCancel callback for the cancel button; if not provided, button not shown
 * @param onConfirm callback for the confirm button
 * @param onDiscard callback for the discard button; if not provided, button not shown
 * @param cancelButtonText optional text for the cancel button, defaults to 'Cancel'
 * @param confirmButtonText optional text for the confirm button, defaults to 'Okay'
 * @param discardButtonText optional text for the discard button, defaults to 'Discard'
 */
const BasicModal: React.FC<BasicModalProps> = props => {
  const {
    isOpen,
    headerText,
    bodyText,
    onCancel,
    onConfirm,
    onDiscard,
    onModalDisable,
    cancelButtonText = 'Cancel',
    confirmButtonText = 'Okay',
    discardButtonText = 'Discard',
    children,
  } = props;

  const confirmButton = useRef<HTMLButtonElement>(null);

  const disableModalCheckbox = useRef<HTMLInputElement>(null);

  const onConfirmClicked = useCallback(() => {
    if (disableModalCheckbox.current?.checked && onModalDisable) {
      onModalDisable();
    }
    onConfirm();
  }, [onConfirm, onModalDisable]);

  let modalBody = '';
  if (isOpen) {
    modalBody = typeof bodyText === 'function' ? bodyText() : bodyText;
  }

  return (
    <Modal
      isOpen={isOpen}
      className="theme-bg-light"
      onOpened={() => {
        confirmButton.current?.focus();
      }}
    >
      <ModalHeader>{headerText}</ModalHeader>
      <ModalBody>{modalBody}</ModalBody>
      <ModalFooter>
        {onModalDisable && (
          <div className="custom-control custom-checkbox form-group mr-auto">
            <input
              type="checkbox"
              className="custom-control-input"
              id="move-confirmation-checkbox"
              defaultChecked={false}
              ref={disableModalCheckbox}
            />
            <label
              className="custom-control-label"
              htmlFor="move-confirmation-checkbox"
            >
              Don&#39;t ask me again
            </label>
          </div>
        )}
        {onDiscard && (
          <button
            type="button"
            className="btn btn-outline-primary mr-auto"
            data-dismiss="modal"
            onClick={onDiscard}
          >
            {discardButtonText}
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            className="btn btn-outline-primary"
            data-dismiss="modal"
            onClick={onCancel}
          >
            {cancelButtonText}
          </button>
        )}
        <ButtonGroup>
          <Button kind="primary" onClick={onConfirmClicked} ref={confirmButton}>
            {confirmButtonText}
          </Button>
          {children}
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};

BasicModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  headerText: PropTypes.string.isRequired,
  bodyText: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
  onDiscard: PropTypes.func,
  onModalDisable: PropTypes.func,
  cancelButtonText: PropTypes.string,
  confirmButtonText: PropTypes.string,
  discardButtonText: PropTypes.string,
  children: PropTypes.node,
};

BasicModal.defaultProps = {
  children: undefined,
  cancelButtonText: 'Cancel',
  confirmButtonText: 'Okay',
  discardButtonText: 'Discard',
  onCancel: undefined,
  onDiscard: undefined,
  onModalDisable: undefined,
};

export default BasicModal;
