/* eslint-disable react/jsx-props-no-spreading */
/* eslint no-alert: "off" */
import React, { CSSProperties } from 'react';
import { ErrorView } from '@deephaven/components';
import { sampleSectionIdAndClasses } from './utils';

function ErrorViews(): React.ReactElement {
  const columnStyle: CSSProperties = {
    maxHeight: 500,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 400,
  };

  const shortErrorMessage = 'This is a short error message';
  const midErrorMessage = 'Mid length error message\n'.repeat(10);
  const longErrorMessage = 'Really long error message\n'.repeat(100);

  const midErrorType = 'MidError';
  const longErrorType = 'SuperLongErrorMessageType';

  return (
    <div {...sampleSectionIdAndClasses('error-views')}>
      <h2 className="ui-title" title="Display error messages easily">
        Error Views
      </h2>
      <h3>Expandable</h3>
      <div className="row" style={{ maxHeight: 500 }}>
        <div className="col" style={columnStyle}>
          <ErrorView message={shortErrorMessage} />
        </div>
        <div className="col" style={columnStyle}>
          <ErrorView message={midErrorMessage} type={midErrorType} />
        </div>
        <div className="col" style={columnStyle}>
          <ErrorView message={longErrorMessage} type={longErrorType} />
        </div>
      </div>
      <h3>Always expanded</h3>
      <div className="row" style={{ maxHeight: 500 }}>
        <div className="col" style={columnStyle}>
          <ErrorView message={shortErrorMessage} isExpanded />
        </div>
        <div className="col" style={columnStyle}>
          <ErrorView message={midErrorMessage} type={midErrorType} isExpanded />
        </div>
        <div className="col" style={columnStyle}>
          <ErrorView
            message={longErrorMessage}
            type={longErrorType}
            isExpanded
          />
        </div>
      </div>
    </div>
  );
}

export default ErrorViews;
