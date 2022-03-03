/**
 * Console display for use in the Iris environment.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ConsoleHistoryItem from './ConsoleHistoryItem';

import './ConsoleHistory.scss';

class ConsoleHistory extends Component {
  static itemKey(i, item) {
    return `${i}.${item.command}.${item.result && item.result.message}.${
      item.result && item.result.error
    }`;
  }

  render() {
    const { disabled, items, language, openObject } = this.props;
    const historyElements = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const historyElement = (
        <ConsoleHistoryItem
          key={ConsoleHistory.itemKey(i, item)}
          disabled={disabled}
          item={item}
          openObject={openObject}
          language={language}
        />
      );
      historyElements.push(historyElement);
    }

    return (
      <div className="container-fluid console-history">{historyElements}</div>
    );
  }
}

ConsoleHistory.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  language: PropTypes.string.isRequired,
  openObject: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ConsoleHistory.defaultProps = {
  disabled: false,
};

export default ConsoleHistory;
