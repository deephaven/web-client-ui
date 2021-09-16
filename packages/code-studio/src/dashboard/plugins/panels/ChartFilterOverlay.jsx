import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ButtonOld } from '@deephaven/components';
import { vsPass, vsIssues } from '@deephaven/icons';
import { TextUtils } from '@deephaven/utils';
import './ChartFilterOverlay.scss';

const ChartFilterOverlay = ({
  columnMap,
  inputFilterMap,
  linkedColumnMap,
  onAdd,
  onOpenLinker,
  waitingFilterMap,
  waitingInputMap,
}) => {
  const inputMessage = useMemo(() => {
    const waitingColumns = [...waitingInputMap.keys()];
    const needsInputFilterValue = waitingColumns.find(
      columnName => inputFilterMap.get(columnName) != null
    );
    const needsLinkValue = waitingColumns.find(
      columnName => linkedColumnMap.get(columnName) != null
    );
    const columnsText = TextUtils.join(waitingColumns.map(item => `"${item}"`));
    if (needsInputFilterValue && needsLinkValue) {
      return `Use a filter control or linked table to set a value for ${columnsText}`;
    }
    if (needsInputFilterValue) {
      return `Set a filter control value for ${columnsText}`;
    }
    return `Double click a row in a linked table to set a value for ${columnsText}`;
  }, [inputFilterMap, linkedColumnMap, waitingInputMap]);

  const columns = useMemo(() => [...columnMap.values()], [columnMap]);

  const handleAddClick = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();

      onAdd([...waitingFilterMap.values()]);
    },
    [onAdd, waitingFilterMap]
  );

  const handleOpenLinker = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();

      onOpenLinker();
    },
    [onOpenLinker]
  );

  const isWaitingFilters = waitingFilterMap.size > 0;
  const isWaitingInput = !isWaitingFilters && waitingInputMap.size > 0;

  return (
    <div className="chart-panel-overlay chart-filter-overlay">
      <div
        className={classNames(
          'chart-panel-overlay-content chart-filter-overlay-content',
          { 'chart-filter-waiting-filter': isWaitingFilters },
          { 'chart-filter-waiting-input': isWaitingInput }
        )}
      >
        {isWaitingFilters && (
          <>
            <div className="info-message">
              This plot requires a filter control to be added to the layout or a
              table link to be created on the following columns:
            </div>
            <div className="waiting-filter-list">
              {columns.map(column => {
                const isColumnWaiting = waitingFilterMap.has(column.name);
                const icon = isColumnWaiting ? vsIssues : vsPass;
                return (
                  <div
                    key={column.name}
                    className={classNames('waiting-filter-item', {
                      'is-invalid': isColumnWaiting,
                    })}
                  >
                    <FontAwesomeIcon icon={icon} />
                    {column.name}
                  </div>
                );
              })}
            </div>
            <div>
              <ButtonOld onClick={handleAddClick} className="btn-primary">
                Add Input Filters
              </ButtonOld>
              <ButtonOld onClick={handleOpenLinker} className="btn-primary">
                Open Linker Tool
              </ButtonOld>
            </div>
          </>
        )}
        {isWaitingInput && (
          <>
            <div className="info-message">Waiting for User Input</div>
            <div className="">{inputMessage}</div>
          </>
        )}
      </div>
    </div>
  );
};

ChartFilterOverlay.propTypes = {
  columnMap: PropTypes.instanceOf(Map).isRequired,
  inputFilterMap: PropTypes.instanceOf(Map).isRequired,
  linkedColumnMap: PropTypes.instanceOf(Map).isRequired,
  onAdd: PropTypes.func.isRequired,
  onOpenLinker: PropTypes.func.isRequired,
  waitingFilterMap: PropTypes.instanceOf(Map).isRequired,
  waitingInputMap: PropTypes.instanceOf(Map).isRequired,
};

export default ChartFilterOverlay;
