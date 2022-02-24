import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@deephaven/components';
import { vsCircleFilled } from '@deephaven/icons';
import './IrisGridCellOverflowButton.scss';

interface IrisGridCellOverflowButtonProps {
  style: React.CSSProperties;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export default function IrisGridCellOverflowButton({
  style,
  onClick,
}: IrisGridCellOverflowButtonProps): JSX.Element {
  return (
    <div style={style} className="overflow-btn-container">
      <Button
        type="button"
        kind="tertiary"
        className="overflow-btn"
        tooltip="View full contents"
        onClick={onClick}
        icon={
          <span className="overflow-icon-container">
            <FontAwesomeIcon icon={vsCircleFilled} />
            <FontAwesomeIcon icon={vsCircleFilled} />
            <FontAwesomeIcon icon={vsCircleFilled} />
          </span>
        }
      />
    </div>
  );
}
