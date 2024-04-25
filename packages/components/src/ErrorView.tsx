import React, { useLayoutEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsDiffAdded, vsDiffRemoved, vsWarning } from '@deephaven/icons';
import CopyButton from './CopyButton';
import Button from './Button';
import './ErrorView.scss';

export type ErrorViewerProps = {
  message: string;
  type?: string;
};

/**
 * Component that displays an error message in a textarea so user can scroll and a copy button.
 */
function ErrorView({ message, type = 'Error' }: ErrorViewerProps): JSX.Element {
  const [isExpandable, setIsExpandable] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea == null) {
      return;
    }
    setIsExpandable(textarea.scrollHeight > textarea.clientHeight);
  }, [isExpanded]);

  return (
    <div className={classNames('error-view', { expanded: isExpanded })}>
      <div className="error-view-header">
        <label className="text-danger">
          <FontAwesomeIcon icon={vsWarning} /> {type}
        </label>
        <div className="error-view-buttons">
          <CopyButton
            kind="danger"
            className="error-view-copy-button"
            tooltip="Copy exception contents"
            copy={`${type}: ${message}`.trim()}
          />
          {(isExpandable || isExpanded) && (
            <Button
              kind="danger"
              className="error-view-expand-button"
              onClick={() => {
                setIsExpanded(!isExpanded);
              }}
              icon={isExpanded ? vsDiffRemoved : vsDiffAdded}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </Button>
          )}
        </div>
      </div>
      <textarea readOnly value={message} ref={textareaRef} />
    </div>
  );
}

export default ErrorView;
