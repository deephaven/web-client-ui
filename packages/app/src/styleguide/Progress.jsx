import React from 'react';
import { DeephavenSpinner, LoadingSpinner } from '@deephaven/components';

const Progress = () => (
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
            aria-valuenow="25"
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </div>

      <div className="col">
        <h5>Indeterminate Progress Spinner</h5>
        <LoadingSpinner className="loading-spinner-large" />
      </div>

      <div className="col">
        <h5>DH Spinner</h5>
        <DeephavenSpinner />
      </div>

      <div className="col">
        <h5>Button Progress Spinner</h5>
        <button
          type="button"
          className="btn btn-primary btn-spinner btn-cancelable"
          style={{ minWidth: '10rem' }}
        >
          <span>
            <LoadingSpinner />
            <span className="btn-normal-content">Connecting</span>
            <span className="btn-hover-content">Cancel</span>
          </span>
        </button>
      </div>
    </div>
  </div>
);

export default Progress;
