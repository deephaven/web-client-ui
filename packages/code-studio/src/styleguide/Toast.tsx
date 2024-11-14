import React from 'react';
import { Button, ButtonGroup, ToastQueue } from '@deephaven/components';
import SampleSection from './SampleSection';

function Toast(): React.ReactElement {
  return (
    <SampleSection name="toast">
      <h2 className="ui-title">Toast</h2>
      <div>
        <ButtonGroup>
          <Button
            kind="tertiary"
            onClick={() =>
              ToastQueue.neutral('Neutral toast', { timeout: 5000 })
            }
          >
            Show neutral toast
          </Button>
          <Button
            kind="success"
            onClick={() =>
              ToastQueue.positive('Positive toast', { timeout: 5000 })
            }
          >
            Show positive toast
          </Button>
          <Button
            kind="danger"
            onClick={() =>
              ToastQueue.negative('Negative toast', { timeout: 5000 })
            }
          >
            Show negative toast
          </Button>
          <Button
            kind="primary"
            onClick={() => ToastQueue.info('Info toast', { timeout: 5000 })}
          >
            Show info toast
          </Button>
        </ButtonGroup>
      </div>
    </SampleSection>
  );
}

export default Toast;
