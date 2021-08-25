import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsEdit } from '@deephaven/icons';

export default class MarkdownNotebookContainer extends PureComponent {
  render() {
    const { isEditing, children, onDoubleClick } = this.props;

    return (
      <div
        className="markdown-notebook-container h-100 w-100"
        onDoubleClick={onDoubleClick}
      >
        {onDoubleClick && (
          <div
            className={classNames('text-muted', 'edit-hint', {
              viewing: !isEditing,
            })}
          >
            <span>
              double-click to edit <FontAwesomeIcon icon={vsEdit} />
            </span>
          </div>
        )}
        {children}
      </div>
    );
  }
}

MarkdownNotebookContainer.propTypes = {
  onDoubleClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  isEditing: PropTypes.bool,
};

MarkdownNotebookContainer.defaultProps = {
  isEditing: false,
  onDoubleClick: null,
};
