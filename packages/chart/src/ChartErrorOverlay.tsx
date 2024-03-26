import { ReactElement } from 'react';
import { ButtonOld, CopyButton } from '@deephaven/components';
import './ChartErrorOverlay.scss';

interface ChartErrorOverlayProps {
  errorMessage: string;
  onDiscard?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  'data-testid'?: string;
}

function ChartErrorOverlay({
  errorMessage,
  onDiscard,
  onConfirm,
  onCancel,
  'data-testid': dataTestId,
}: ChartErrorOverlayProps): ReactElement {
  const messageTestId =
    dataTestId != null ? `${dataTestId}-message` : undefined;

  // TODO: DHC #5220 to detect slow performance and show this message

  const undismissableError =
    errorMessage === 'Too many items to disable downsampling';

  return (
    <div className="chart-panel-overlay chart-error-overlay">
      <div className="chart-panel-overlay-content chart-error-overlay-content">
        <div className="info-message" data-testid={messageTestId}>
          {errorMessage}
          <CopyButton copy={errorMessage} style={{ margin: '0' }} />
        </div>
        {/* {!undismissableError && ( */}
        <div>
          {onCancel && (
            <ButtonOld onClick={onCancel} className="btn-primary">
              Dismiss
            </ButtonOld>
          )}
          {onDiscard && (
            <ButtonOld onClick={onDiscard} className="btn-primary">
              Dismiss
            </ButtonOld>
          )}
          {onConfirm && !undismissableError && (
            <ButtonOld onClick={onConfirm} className="btn-primary">
              Continue
            </ButtonOld>
          )}
        </div>
        {/* )} */}
      </div>
    </div>
  );
}

export default ChartErrorOverlay;
