/**
 * Console display for use in the Iris environment.
 */
import React, { ReactElement, ReactNode } from 'react';
import PropTypes from 'prop-types';

const ConsoleHistoryItemResult = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => (
  <div className="console-history-item-result">
    <div className="console-history-gutter">-</div>
    <div className="console-history-content">{children}</div>
  </div>
);

ConsoleHistoryItemResult.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ConsoleHistoryItemResult;
