import React, { useState, type CSSProperties } from 'react';
import { Button, ErrorView } from '@deephaven/components';
import SampleSection from './SampleSection';

function ErrorViews(): React.ReactElement {
  const [isShortDismissed, setIsShortDismissed] = useState(false);
  const [isMidDismissed, setIsMidDismissed] = useState(false);
  const [isLongDismissed, setIsLongDismissed] = useState(false);

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

  const hasAnyDismissed = isShortDismissed || isMidDismissed || isLongDismissed;

  const handleReset = () => {
    setIsShortDismissed(false);
    setIsMidDismissed(false);
    setIsLongDismissed(false);
  };

  return (
    <SampleSection name="error-views">
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
      <h3>
        Dismissable
        {hasAnyDismissed && (
          <Button
            kind="primary"
            onClick={handleReset}
            style={{ marginLeft: '1rem' }}
          >
            Reset
          </Button>
        )}
      </h3>
      <div className="row" style={{ maxHeight: 500 }}>
        <div className="col" style={columnStyle}>
          {!isShortDismissed && (
            <ErrorView
              message={shortErrorMessage}
              onDismiss={() => {
                setIsShortDismissed(true);
              }}
            />
          )}
        </div>
        <div className="col" style={columnStyle}>
          {!isMidDismissed && (
            <ErrorView
              message={midErrorMessage}
              type={midErrorType}
              onDismiss={() => {
                setIsMidDismissed(true);
              }}
            />
          )}
        </div>
        <div className="col" style={columnStyle}>
          {!isLongDismissed && (
            <ErrorView
              message={longErrorMessage}
              type={longErrorType}
              onDismiss={() => {
                setIsLongDismissed(true);
              }}
            />
          )}
        </div>
      </div>
    </SampleSection>
  );
}

export default ErrorViews;
