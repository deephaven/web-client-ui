import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import Modal from './Modal';
import ModalBody from './ModalBody';
import './InfoModal.scss';

type InfoModalProps = {
  /** Class name to give the info modal */
  className?: string;

  /** Icon to display in the modal */
  icon?: IconProp;

  /** Title to display in the modal */
  title: React.ReactNode;

  /** Subtitle/detail to display in the modal */
  subtitle?: React.ReactNode;

  /** Whether the modal is open/visible or not. */
  isOpen: boolean;
};

/**
 * A modal that displays a message with an icon. Can be used for informational messages, warnings, or errors.
 * Does not have any buttons and cannot be dismissed.
 */
function InfoModal({
  className,
  icon,
  isOpen,
  subtitle,
  title,
}: InfoModalProps): JSX.Element {
  return (
    <Modal isOpen={isOpen} className={className}>
      <ModalBody>
        <div className="info-modal">
          {icon != null && (
            <div className="message-icon">
              <FontAwesomeIcon icon={icon} />
            </div>
          )}
          <div className="message-header">{title}</div>
          {subtitle != null && (
            <div className="message-content">{subtitle}</div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}

export default InfoModal;
