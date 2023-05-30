import React, { ForwardedRef } from 'react';
import './PanelPlaceholder.scss';
import LayoutUtils from './layout/LayoutUtils';
import { PanelProps } from './DashboardPlugin';

/**
 * Displays a placeholder for unregistered panel types.
 */
const PanelPlaceholder = React.forwardRef(
  (props: PanelProps, ref: ForwardedRef<HTMLDivElement>) => {
    const component = LayoutUtils.getComponentNameFromPanel({ props });
    return (
      <div ref={ref} className="panel-placeholder">
        <div>Component &quot;{component}&quot; is not registered.</div>
      </div>
    );
  }
);

PanelPlaceholder.displayName = 'PanelPlaceholder';

export default PanelPlaceholder;
