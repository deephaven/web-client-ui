import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@deephaven/components';
import { vsArrowLeft } from '@deephaven/icons';
import './CommandHistoryActions.scss';

class CommandHistoryActions extends Component {
  static itemKey(i, item) {
    return `${item.title}`;
  }

  static renderContent(item) {
    if (item.selectionRequired && item.icon) {
      return (
        <div className="fa-md fa-layers">
          <FontAwesomeIcon icon={item.icon} />
          <FontAwesomeIcon
            icon={vsArrowLeft}
            transform="shrink-3 right-12 up-9"
          />
        </div>
      );
    }

    if (!item.selectionRequired && item.icon) {
      return <FontAwesomeIcon icon={item.icon} />;
    }

    return item.title;
  }

  render() {
    const { actions, hasSelection } = this.props;

    return (
      <div className="command-history-actions">
        {actions.map((item, index) => (
          <button
            className={classNames('btn btn-inline ml-1', item.className)}
            key={CommandHistoryActions.itemKey(index, item)}
            onClick={item.action}
            type="button"
            disabled={item.selectionRequired && !hasSelection}
          >
            {CommandHistoryActions.renderContent(item)}
            <Tooltip options={{ placement: 'bottom' }}>
              {item.description}
            </Tooltip>
          </button>
        ))}
      </div>
    );
  }
}

CommandHistoryActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      action: PropTypes.func.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.FontAwesomeIcon,
      selectionRequired: PropTypes.bool,
    })
  ).isRequired,
  hasSelection: PropTypes.bool.isRequired,
};

export default CommandHistoryActions;
