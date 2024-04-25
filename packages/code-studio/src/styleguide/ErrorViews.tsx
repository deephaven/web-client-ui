/* eslint-disable react/jsx-props-no-spreading */
/* eslint no-alert: "off" */
import React, { CSSProperties } from 'react';
import { ErrorView } from '@deephaven/components';
import { sampleSectionIdAndClasses } from './utils';

function ErrorViews(): React.ReactElement {
  const columnStyle: CSSProperties = {
    height: 500,
    display: 'flex',
    flexDirection: 'column',
  };
  return (
    <div {...sampleSectionIdAndClasses('error-views')}>
      <h2 className="ui-title" title="Display error messages easily">
        Error Views
      </h2>
      <div className="row">
        <div className="col" style={columnStyle}>
          <ErrorView message="This is an error message" />
        </div>
        <div className="col" style={columnStyle}>
          <ErrorView
            message={'Really long error message\n'.repeat(100)}
            type="LongError"
          />
        </div>
      </div>
    </div>
  );
}

export default ErrorViews;
