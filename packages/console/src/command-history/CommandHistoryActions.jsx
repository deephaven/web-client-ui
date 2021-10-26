import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@deephaven/components';
import { vsArrowLeft, vsCircleLargeFilled } from '@deephaven/icons';
import './CommandHistoryActions.scss';

class CommandHistoryActions extends Component {
  static itemKey(i, item) {
    return `${item.title}`;
  }

  static renderContent(item) {
    if (item.selectionRequired && item.icon) {
      return (
        <div className="fa-md fa-layers">
          <FontAwesomeIcon
            icon={vsCircleLargeFilled}
            mask={item.icon}
            transform="right-5 down-5 shrink-4"
          />
          <FontAwesomeIcon
            icon={vsArrowLeft}
            transform="shrink-3 right-7 down-6"
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
          <Button
            kind="inline"
            className={classNames(item.className)}
            key={CommandHistoryActions.itemKey(index, item)}
            onClick={item.action}
            tooltip={item.description}
            disabled={item.selectionRequired && !hasSelection}
            icon={CommandHistoryActions.renderContent(item)}
          />
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
