import React, { useState } from 'react';
import { BasicModal, Button, Checkbox } from '@deephaven/components';

function Modals(): React.ReactElement {
  const [openModal, setOpenModal] = useState<number>(0);
  const [check1, setCheck1] = useState<boolean>(true);
  const closeModals = () => {
    setOpenModal(0);
  };

  function renderBasicModal(buttonCount: number) {
    return (
      <React.Fragment key={buttonCount}>
        <Button
          kind="primary"
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          onClick={() => {
            setOpenModal(buttonCount);
          }}
        >
          {buttonCount} {buttonCount > 1 ? 'Actions' : 'Action'}
        </Button>
        <BasicModal
          isOpen={openModal === buttonCount}
          headerText="Header Text"
          bodyText="This is where the body text goes"
          onConfirm={closeModals}
          onCancel={buttonCount >= 2 ? closeModals : undefined}
          onDiscard={buttonCount >= 3 ? closeModals : undefined}
        />
      </React.Fragment>
    );
  }

  return (
    <div>
      <h2 className="ui-title">Basic Modals</h2>
      <div style={{ padding: '1rem' }}>
        {[1, 2, 3].map(buttonCount => renderBasicModal(buttonCount))}
      </div>
      <h2 className="ui-title">Custom Modal</h2>
      <div style={{ padding: '1rem' }}>
        <div className="modal-dialog theme-bg-light" role="dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Modal title</h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <p>Modal body text goes here.</p>

              <Checkbox checked={check1} onChange={() => setCheck1(!check1)}>
                Checked checkbox
              </Checkbox>
            </div>
            <div className="modal-footer">
              <Button
                kind="secondary"
                data-dismiss="modal"
                onClick={() => undefined}
              >
                Close
              </Button>
              <Button kind="primary" onClick={() => undefined}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modals;
