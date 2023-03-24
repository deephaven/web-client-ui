import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import Modal from './Modal';
import ModalBody from './ModalBody';
import './InfoModal.scss';

type InfoModalProps = {
  className?: string;
  icon?: IconProp;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  isOpen: boolean;
};

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
