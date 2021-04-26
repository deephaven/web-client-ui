import React, { useState } from 'react';
import { BasicModal, Checkbox } from '@deephaven/components';

const Modals = () => {
  const [openModal, setOpenModal] = useState(0);
  const [check1, setCheck1] = useState(true);
  const closeModals = () => {
    setOpenModal(0);
  };

  function renderBasicModal(buttonCount) {
    return (
      <React.Fragment key={buttonCount}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          onClick={() => {
            setOpenModal(buttonCount);
          }}
        >
          {buttonCount} {buttonCount > 1 ? 'Actions' : 'Action'}
        </button>
        <BasicModal
          isOpen={openModal === buttonCount}
          headerText="Header Text"
          bodyText="This is where the body text goes"
          onConfirm={closeModals}
          onCancel={buttonCount >= 2 ? closeModals : null}
          onDiscard={buttonCount >= 3 ? closeModals : null}
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
              <button
                type="button"
                className="btn btn-outline-primary"
                data-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modals;
