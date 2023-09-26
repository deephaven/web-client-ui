import React from 'react';
import { Button, LoadingSpinner } from '@deephaven/components';

function Progress(): React.ReactElement {
  return (
    <div>
      <h2 className="ui-title">Progress</h2>
      <div className="row">
        <div className="col">
          <h5>Determinate Progress Loader</h5>
          <br />
          <div className="progress" style={{ marginBottom: '1rem' }}>
            <div
              className="progress-bar bg-primary"
              style={{ width: '25%' }}
              aria-valuenow={25}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <div className="col">
          <h5>Indeterminate Progress Spinner</h5>
          <LoadingSpinner className="loading-spinner-large" />
        </div>

        <div className="col">
          <h5>Button Progress Spinner</h5>
          <Button
            kind="primary"
            className="btn-spinner btn-cancelable"
            style={{ minWidth: '10rem' }}
            onClick={() => undefined}
          >
            <span>
              <LoadingSpinner className="loading-spinner-vertical-align" />
              <span className="btn-normal-content">Connecting</span>
              <span className="btn-hover-content">Cancel</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Progress;
