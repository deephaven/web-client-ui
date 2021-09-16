import React from 'react';
import './PanelPlaceholder.scss';
import { LayoutUtils } from '@deephaven/dashboard';

/**
 * Displays a placeholder for unregistered panel types.
 */
const PanelPlaceholder = React.forwardRef((props, ref) => {
  const component = LayoutUtils.getComponentNameFromPanel({ props });
  return (
    <div ref={ref} className="panel-placeholder">
      Component &quot;{component}&quot; is not registered.
    </div>
  );
});

export default PanelPlaceholder;
