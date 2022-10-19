import React, { ReactElement, useState } from 'react';
import { Button, Modal, ModalBody, ModalHeader } from '@deephaven/components';
import { vsLaw } from '@deephaven/icons';

const LegalNotice = (): ReactElement => {
  const [modal, setModal] = useState(false);
  const toggle = () => {
    setModal(!modal);
  };

  return (
    <Button kind="ghost" onClick={toggle} icon={vsLaw}>
      Legal Notices
      <Modal isOpen={modal} toggle={toggle} className="theme-bg-light">
        <ModalHeader toggle={toggle}>Legal Notice</ModalHeader>
        <ModalBody>
          <p>
            Deephaven software is protected by U.S. Patent Nos. 9,612,959;
            9,613,018; 9,613,109; 9,619,210; 9,633,060; 9,639,570; 9,672,238;
            9,679,006; 9,690,821; 9,710,511; 9,760,591; 9,805,084; 9,836,495;
            9,836,494; 9,886,469; 9,898,496; 9,934,266; 10,002,153; 10,002,154;
            10,002,155; 10,003,673; 10,019,138; 10,069,943; 10,176,211;
            10,198,465; 10,198,466; 10,198,469; 10,212,257; 10,241,960;
            10,241,965; 10,242,040; 10,242,041; 10,353,893; 10,346,394;
            10,452,649; 10,496,639; 10,540,351; 10,552,412; 10,565,194;
            10,565,206; 10,572,474; 10,621,168; 10,642,829; 10,657,184;
            10,678,787; 10,691,686; and 10,783,191. Other patents pending.
          </p>
          <p>
            © 2016-{new Date().getFullYear()} Deephaven Data Labs LLC. Patent
            Pending.
          </p>
        </ModalBody>
      </Modal>
    </Button>
  );
};

export default LegalNotice;
