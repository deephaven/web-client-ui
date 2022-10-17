import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose, vsChevronLeft } from '@deephaven/icons';
import './Page.scss';
import Button from '../Button';

export type PageProps = {
  children: React.ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  title: string;
  'data-testid'?: string;
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
  'data-testid': dataTestId,
}: PageProps): JSX.Element => (
  <div className="navigation-page" data-testid={dataTestId}>
    <div className="navigation-title-bar">
      <div className="navigation-left-buttons">
        {onBack !== undefined && (
          <Button
            kind="ghost"
            className="btn-back"
            data-testid="btn-page-back"
            onClick={onBack}
            icon={vsChevronLeft}
          >
            Back
          </Button>
        )}
      </div>
      <div className="navigation-title">{title}</div>
      <div className="navigation-right-buttons">
        {onClose !== undefined && (
          <Button
            kind="ghost"
            className="btn-close px-2 m-1"
            data-testid="btn-page-close"
            onClick={onClose}
            icon={vsClose}
            tooltip="Close"
          />
        )}
      </div>
    </div>
    <div className="navigation-content">{children}</div>
  </div>
);

export default Page;
