import React, {
  MouseEventHandler,
  PureComponent,
  ReactElement,
  ReactNode,
} from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsEdit } from '@deephaven/icons';

interface MarkdownContainerProps {
  onDoubleClick: MouseEventHandler;
  children: ReactNode;
  isEditing?: boolean;
}

export default class MarkdownContainer extends PureComponent<
  MarkdownContainerProps,
  Record<string, never>
> {
  static defaultProps = {
    isEditing: false,
  };

  render(): ReactElement {
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
