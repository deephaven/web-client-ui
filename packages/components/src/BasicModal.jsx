import React, { useRef, useCallback } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import PropTypes from 'prop-types';
import ButtonGroup from './ButtonGroup';
import Button from './Button';

/**
 * A basic modal dialog with two buttons: cancel / confirm.
 *
 * @param {boolean} isOpen indicates if the modal dialog is open
 * @param {string} headerText text displayed in the modal header
 * @param {string} bodyText text displayed in the modal body
 * @param {func} onCancel callback for the cancel button; if not provided, button not shown
 * @param {func} onConfirm callback for the confirm button
 * @param {func} onDiscard callback for the discard button; if not provided, button not shown
 * @param {string} cancelButtonText optional text for the cancel button, defaults to 'Cancel'
 * @param {string} confirmButtonText optional text for the confirm button, defaults to 'Okay'
 * @param {string} discardButtonText optional text for the discard button, defaults to 'Discard'
 */
const BasicModal = props => {
  const {
    isOpen,
    headerText,
    bodyText,
    onCancel,
    onConfirm,
    onDiscard,
    onModalDisable,
    cancelButtonText,
    confirmButtonText,
    discardButtonText,
    children,
  } = props;

  const confirmButton = useRef(null);

  const disableModalCheckbox = useRef(null);

  const onConfirmClicked = useCallback(() => {
    if (disableModalCheckbox.current && disableModalCheckbox.current.checked) {
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
        confirmButton.current.focus();
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

  onCancel: null,
  onDiscard: null,
  onModalDisable: null,
};

export default BasicModal;
