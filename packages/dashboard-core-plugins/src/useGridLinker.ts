import { useCallback, useEffect, useMemo } from 'react';
import clamp from 'lodash.clamp';
import {
  useAppSelector,
  useDashboardId,
  useDhId,
  useLayoutManager,
  usePanelId,
} from '@deephaven/dashboard';
import { type RootState } from '@deephaven/redux';
import {
  type IrisGridProps,
  type IrisGridModel,
  type IrisGridType,
} from '@deephaven/iris-grid';
import { type ModelIndex } from '@deephaven/grid';
import { type RowDataMap } from '@deephaven/jsapi-utils';
import { type dh } from '@deephaven/jsapi-types';
import { assertNotNull } from '@deephaven/utils';
import {
  emitLinkPointSelected,
  emitLinkSourceDataSelected,
  emitRegisterLinkTarget,
} from './linker/LinkerEvent';
import {
  getColumnSelectionValidatorForDashboard,
  getLinksForDashboard,
} from './redux';

export function useGridLinker(
  model: IrisGridModel | null,
  irisGrid: IrisGridType | null
): Pick<
  IrisGridProps,
  | 'alwaysFetchColumns'
  | 'columnSelectionValidator'
  | 'isSelectingColumn'
  | 'onColumnSelected'
  | 'onDataSelected'
> {
  const { eventHub } = useLayoutManager();
  const dashboardId = useDashboardId();
  const dhId = useDhId();
  const panelId = usePanelId();

  const getLinks = useCallback(
    (s: RootState) => getLinksForDashboard(s, dashboardId),
    [dashboardId]
  );

  const links = useAppSelector(getLinks);
  const linkColumns = useMemo(() => {
    const columnSet = new Set<string>();
    links.forEach(link => {
      if (link.start.panelId === dhId) {
        columnSet.add(link.start.columnName);
      }
    });
    return [...columnSet];
  }, [links, dhId]);

  const getColumnSelectionValidator = useCallback(
    (s: RootState) => getColumnSelectionValidatorForDashboard(s, dashboardId),
    [dashboardId]
  );
  const columnSelectionValidator = useAppSelector(getColumnSelectionValidator);

  const isColumnSelectionValid = useCallback(
    (column: dh.Column | null) => {
      if (columnSelectionValidator && column && dhId != null) {
        return columnSelectionValidator(dhId, column, { type: 'tableLink' });
      }
      return false;
    },
    [columnSelectionValidator, dhId]
  );
  const isSelectingColumn = columnSelectionValidator != null;

  const onDataSelected = useCallback(
    (row: ModelIndex, dataMap: RowDataMap) => {
      if (dhId == null) {
        return;
      }
      emitLinkSourceDataSelected(eventHub, dhId, dataMap);
    },
    [eventHub, dhId]
  );

  const getCoordinates = useCallback(
    (columnName: string): [number, number] | null => {
      if (!model || !irisGrid) {
        return null;
      }

      const { gridWrapper } = irisGrid;
      const rect = gridWrapper?.getBoundingClientRect() ?? null;
      if (rect == null || rect.width <= 0 || rect.height <= 0) {
        return null;
      }
      const { metrics } = irisGrid.state;
      assertNotNull(metrics);
      const {
        columnHeaderHeight,
        allColumnXs,
        allColumnWidths,
        right,
        columnHeaderMaxDepth,
      } = metrics;
      const columnIndex = model.getColumnIndexByName(columnName);
      assertNotNull(columnIndex);
      const visibleIndex = irisGrid.getVisibleColumn(columnIndex);
      const columnX = allColumnXs.get(visibleIndex) ?? 0;
      const columnWidth = allColumnWidths.get(visibleIndex) ?? 0;

      const x = clamp(
        visibleIndex > right
          ? rect.right
          : rect.left + columnX + columnWidth * 0.5,
        rect.left,
        rect.right
      );
      const y = rect.top + columnHeaderHeight * columnHeaderMaxDepth;

      return [x, y];
    },
    [model, irisGrid]
  );

  const onColumnSelected = useCallback(
    (column: dh.Column) => {
      if (dhId == null) {
        return;
      }
      emitLinkPointSelected(eventHub, dhId, column, {
        type: 'tableLink',
      });
    },
    [eventHub, dhId]
  );

  useEffect(
    function registerTarget() {
      if (!irisGrid || panelId == null || dhId == null) {
        return;
      }
      emitRegisterLinkTarget(eventHub, dhId, {
        getCoordinates,
        setFilterValues: irisGrid.setFilterMap,
        unsetFilterValue: () => {
          // No-op
        },
        panelId,
      });
      return () => {
        emitRegisterLinkTarget(eventHub, dhId, null);
      };
    },
    [eventHub, dhId, getCoordinates, irisGrid, panelId]
  );

  return {
    alwaysFetchColumns: linkColumns,
    columnSelectionValidator: isColumnSelectionValid,
    isSelectingColumn,
    onColumnSelected,
    onDataSelected,
  };
}

export default useGridLinker;
