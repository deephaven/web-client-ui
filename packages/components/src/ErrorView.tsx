import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsDiffAdded, vsDiffRemoved, vsWarning } from '@deephaven/icons';
import {
  useDebouncedCallback,
  useResizeObserver,
} from '@deephaven/react-hooks';
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
  const viewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLPreElement>(null);

  const handleResize = useCallback(() => {
    if (isExpanded || textareaRef.current == null) {
      return;
    }
    const newIsExpandable =
      textareaRef.current.scrollHeight > textareaRef.current.clientHeight;
    setIsExpandable(newIsExpandable);
  }, [isExpanded]);

  const debouncedHandleResize = useDebouncedCallback(handleResize, 100);

  useResizeObserver(viewRef.current, debouncedHandleResize);

  useLayoutEffect(debouncedHandleResize, [debouncedHandleResize]);

  return (
    <div
      className={classNames('error-view', { expanded: isExpanded })}
      ref={viewRef}
    >
      <div className="error-view-header">
        <div className="error-view-header-text">
          <FontAwesomeIcon icon={vsWarning} />
          <span>{type}</span>
        </div>
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
      <pre className="error-view-text" ref={textareaRef}>
        {message}
      </pre>
    </div>
  );
}

export default ErrorView;
