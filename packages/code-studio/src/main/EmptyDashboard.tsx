import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsArrowUp } from '@deephaven/icons';
import './EmptyDashboard.scss';

export function EmptyDashboard(): JSX.Element {
  return (
    <div className="empty-dashboard-container">
      <div className="hint-container">
        <FontAwesomeIcon icon={vsArrowUp} /> <br />
        Use the panel list to add objects from a query.
      </div>
      <div className="empty-dashboard">
        <div className="add-panels-hint">Drag Panels Here</div>
      </div>
    </div>
  );
}

export default EmptyDashboard;
