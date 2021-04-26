import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsEdit } from '@deephaven/icons';

export default class MarkdownContainer extends PureComponent {
  render() {
    const { isEditing, children, onDoubleClick } = this.props;

    return (
      <div
        className="markdown-editor-container h-100 w-100"
        onDoubleClick={onDoubleClick}
      >
        <div
          className={classNames('text-muted', 'edit-hint', {
            viewing: !isEditing,
          })}
        >
          <span>
            double-click to edit <FontAwesomeIcon icon={vsEdit} />
          </span>
        </div>
        {children}
      </div>
    );
  }
}

MarkdownContainer.propTypes = {
  onDoubleClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  isEditing: PropTypes.bool,
};

MarkdownContainer.defaultProps = {
  isEditing: false,
};
