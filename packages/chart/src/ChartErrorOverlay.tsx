import { ReactElement } from 'react';
import classNames from 'classnames';
import { ButtonOld } from '@deephaven/components';
import './ChartErrorOverlay.scss';

interface ChartErrorOverlayProps {
  errorMessage: string;
  clearError?: () => void;
  'data-testid'?: string;
}

function ChartErrorOverlay({
  errorMessage,
  clearError,
  'data-testid': dataTestId,
}: ChartErrorOverlayProps): ReactElement {
  const messageTestId =
    dataTestId != null ? `${dataTestId}-message` : undefined;

  const slowPerformanceMessage = errorMessage.includes(
    'Plot contains more than'
  ); // TODO: core side changes to detect slow performance and show this message

  const undismissableError =
    errorMessage === 'Too many items to disable downsampling';

  return (
    <div className="chart-panel-overlay chart-error-overlay">
      <div
        className={classNames(
          'chart-panel-overlay-content chart-error-overlay-content'
        )}
      >
        <div className="info-message" data-testid={messageTestId}>
          {errorMessage}
        </div>
        {!undismissableError && (
          <div>
            <ButtonOld onClick={clearError} className="btn-primary">
              {slowPerformanceMessage ? 'Continue Anyways' : 'Continue'}
            </ButtonOld>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartErrorOverlay;
