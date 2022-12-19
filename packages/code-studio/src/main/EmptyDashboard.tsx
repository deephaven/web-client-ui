import React, { MouseEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@deephaven/components';
import { vsArrowUp } from '@deephaven/icons';
import './EmptyDashboard.scss';

export interface EmptyDashboardProps {
  onAutoFillClick?: (event: MouseEvent) => void;
}

export function EmptyDashboard({
  onAutoFillClick = () => undefined,
}: EmptyDashboardProps): JSX.Element {
  return (
    <div className="empty-dashboard-container">
      <div className="hint-container">
        <FontAwesomeIcon icon={vsArrowUp} /> <br />
        Use the panel list to add objects from a query.
      </div>
      <div className="empty-dashboard">
        <div className="add-panels-hint">Drag Panels Here</div>
        <Button kind="tertiary" onClick={onAutoFillClick}>
          Auto fill objects
        </Button>
      </div>
    </div>
  );
}

export default EmptyDashboard;
