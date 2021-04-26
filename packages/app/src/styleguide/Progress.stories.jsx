import React from 'react';
import { LoadingSpinner } from '@deephaven/components';

export default {
  title: 'Progress',
};

const DeterminateTemplate = () => (
  <div className="progress" style={{ marginBottom: '1rem' }}>
    <div
      className="progress-bar bg-primary"
      style={{ width: '25%' }}
      aria-valuenow="25"
      aria-valuemin="0"
      aria-valuemax="100"
    />
  </div>
);

export const Determinate = DeterminateTemplate.bind({});

const IndeterminateTemplate = args => <LoadingSpinner {...args} />;

export const Indeterminate = IndeterminateTemplate.bind({});
Indeterminate.args = {
  className: 'loading-spinner-large',
};

const ButtonTemplate = () => (
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
);
export const ButtonSpinner = ButtonTemplate.bind({});
