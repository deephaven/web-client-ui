/**
 * Console display for use in the Iris environment.
 */
import React, { type ReactElement } from 'react';

function ConsoleHistoryItemResult({
  children,
}: React.PropsWithChildren): ReactElement {
  return (
    <div className="console-history-item-result">
      <div className="console-history-gutter">-</div>
      <div className="console-history-content">{children}</div>
    </div>
  );
}

export default ConsoleHistoryItemResult;
