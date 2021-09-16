import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { SocketedButton } from '@deephaven/components';
import './ChartColumnSelectorOverlay.scss';

const ChartColumnSelectorOverlay = ({
  columns,
  onColumnSelected,
  onMouseEnter,
  onMouseLeave,
}) => (
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
              onMouseEnter={() => onMouseEnter(column)}
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

ChartColumnSelectorOverlay.makeButtonClassName = columnName =>
  `btn-chart-column-selector-${columnName}`;

ChartColumnSelectorOverlay.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      isValid: PropTypes.bool.isRequired,
      isActive: PropTypes.bool.isRequired,
    })
  ).isRequired,
  onColumnSelected: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
};

ChartColumnSelectorOverlay.defaultProps = {
  onMouseEnter: () => {},
  onMouseLeave: () => {},
};

export default ChartColumnSelectorOverlay;
