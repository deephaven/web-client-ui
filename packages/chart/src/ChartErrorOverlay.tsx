import { type ReactElement } from 'react';
import { CopyButton, Button } from '@deephaven/components';
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

  return (
    <div className="chart-panel-overlay chart-error-overlay">
      <div className="chart-panel-overlay-content chart-error-overlay-content">
        <div className="info-message" data-testid={messageTestId}>
          {errorMessage}
          <CopyButton copy={errorMessage} style={{ margin: '0' }} />
        </div>
        <div>
          {onCancel && (
            <Button onClick={onCancel} kind="secondary">
              Cancel
            </Button>
          )}
          {onDiscard && (
            <Button onClick={onDiscard} kind="secondary">
              Dismiss
            </Button>
          )}
          {onConfirm && (
            <Button onClick={onConfirm} kind="primary">
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChartErrorOverlay;
