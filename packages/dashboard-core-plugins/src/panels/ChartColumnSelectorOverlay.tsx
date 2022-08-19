import React, { MouseEventHandler, ReactElement } from 'react';
import classNames from 'classnames';
import { SocketedButton } from '@deephaven/components';
import './ChartColumnSelectorOverlay.scss';

export interface SelectorColumn {
  name: string;
  type: string;
  isValid: boolean;
  isActive: boolean;
}

interface ChartColumnSelectorOverlayProps {
  columns: SelectorColumn[];
  onColumnSelected: (name: string) => void;
  onMouseEnter?: (column: SelectorColumn) => void;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
}

const ChartColumnSelectorOverlay = ({
  columns,
  onColumnSelected,
  onMouseEnter,
  onMouseLeave,
}: ChartColumnSelectorOverlayProps): ReactElement => (
  <div className="chart-panel-overlay chart-column-selector-overlay">
    <div className={classNames('chart-panel-overlay-content')}>
      <>
        <div className="info-message">
          This plot requires a filter control to be added to the layout or a
          table link to be created on the following columns:
        </div>
        <div className="waiting-column-select-list">
          {columns.map(column => (
            <SocketedButton
              key={column.name}
              className={classNames(
                'btn-chart-column-selector',
                ChartColumnSelectorOverlay.makeButtonClassName(column.name)
              )}
              onClick={() => onColumnSelected(column.name)}
              onMouseEnter={() => {
                if (onMouseEnter) onMouseEnter(column);
              }}
              onMouseLeave={onMouseLeave}
              disabled={!column.isValid}
              isLinked={column.isActive}
            >
              {column.name}
            </SocketedButton>
          ))}
        </div>
      </>
    </div>
  </div>
);

ChartColumnSelectorOverlay.makeButtonClassName = (columnName: string) =>
  `btn-chart-column-selector-${columnName}`;

ChartColumnSelectorOverlay.defaultProps = {
  onMouseEnter: (): void => undefined,
  onMouseLeave: (): void => undefined,
};

export default ChartColumnSelectorOverlay;
