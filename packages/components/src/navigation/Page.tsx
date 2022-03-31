import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose, vsChevronLeft } from '@deephaven/icons';
import './Page.scss';

export type PageProps = {
  children: React.ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  title: string;
};

/**
 * A page view with a back button in the bottom left, a title at the top, and a close button in the top right.
 * Back and close buttons will only appear if `onBack` and/or `onClose` callbacks are set.
 */
export const Page = ({
  children,
  onBack,
  onClose,
  title,
}: PageProps): JSX.Element => (
  <div className="navigation-page">
    <div className="navigation-title-bar">
      <div className="navigation-left-buttons">
        {onBack !== undefined && (
          <button
            className="btn btn-link btn-back"
            data-testid="page-back-button"
            type="button"
            onClick={onBack}
          >
            <FontAwesomeIcon icon={vsChevronLeft} />
            Back
          </button>
        )}
      </div>
      <div className="navigation-title">{title}</div>
      <div className="navigation-right-buttons">
        {onClose !== undefined && (
          <button
            className="btn btn-link btn-link-icon btn-close px-2 m-1"
            data-testid="page-close-button"
            type="button"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={vsClose} />
          </button>
        )}
      </div>
    </div>
    <div className="navigation-content">{children}</div>
  </div>
);

export default Page;
