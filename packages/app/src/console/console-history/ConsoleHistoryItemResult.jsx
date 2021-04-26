/**
 * Console display for use in the Iris environment.
 */
import React from 'react';
import PropTypes from 'prop-types';

const ConsoleHistoryItemResult = ({ children }) => (
  <div className="console-history-item-result">
    <div className="console-history-gutter">-</div>
    <div className="console-history-content">{children}</div>
  </div>
);

ConsoleHistoryItemResult.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ConsoleHistoryItemResult;
