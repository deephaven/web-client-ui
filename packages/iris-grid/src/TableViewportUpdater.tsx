import { PureComponent } from 'react';
import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import { GridUtils, MoveOperation } from '@deephaven/grid';
import type { dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { ColumnName } from './CommonTypes';

const log = Log.module('TableViewportUpdater');

const UPDATE_THROTTLE = 150;

/**
 * Updates the viewport for an Iris table, for use in a scroll pane.
 * Automatically throttles the viewport requests and buffers above and below.
 */

interface TableViewportUpdaterProps {
  table: dh.Table;
  top: number;
  bottom: number;
  left: number;
  right: number;
  columns: dh.Column[];
  filters: dh.FilterCondition[];
  sorts: dh.Sort[];
  customColumns: ColumnName[];
  movedColumns: MoveOperation[];
  onSubscription: (subscription?: dh.TableViewportSubscription) => void;
}

class TableViewportUpdater extends PureComponent<
  TableViewportUpdaterProps,
  Record<string, never>
> {
  // Number of pages to buffer for rows/columns
  static ROW_BUFFER_PAGES = 3;

  static COLUMN_BUFFER_PAGES = 1;

  static defaultProps = {
    top: 0,
    bottom: 0,
    left: null,
    right: null,
    columns: null,
    onSubscription: (): void => undefined,
    filters: [],
    sorts: [],
    customColumns: [],
    movedColumns: [],
  };

  componentDidMount(): void {
    const {
      top,
      bottom,
      left,
      right,
      table,
      filters,
      sorts,
      columns,
      customColumns,
    } = this.props;
    table.applyFilter(filters);
    table.applySort(sorts);
    table.applyCustomColumns(customColumns);
    this.updateViewport(top, bottom, left, right, columns);
  }

  componentDidUpdate(prevProps: TableViewportUpdaterProps): void {
    const {
      top,
      bottom,
      left,
      right,
      table,
      filters,
      sorts,
      customColumns,
      columns,
    } = this.props;
    const isFilterChanged = filters !== prevProps.filters;
    const isSortChanged = sorts !== prevProps.sorts;
    const isCustomColumnsChanged = customColumns !== prevProps.customColumns;
    const isTableChanged = table !== prevProps.table;
    if (
      isFilterChanged ||
      isSortChanged ||
      isCustomColumnsChanged ||
      isTableChanged
    ) {
      this.closeSubscription();
    }

    if (isFilterChanged || isTableChanged) {
      log.debug('update table filter', filters);
      table.applyFilter(filters);
    }

    if (isSortChanged || isTableChanged) {
      log.debug('update table sort', sorts);
      table.applySort(sorts);
    }

    if (isCustomColumnsChanged || isTableChanged) {
      log.debug('update table custom columns', customColumns);
      table.applyCustomColumns(customColumns);
    }

    this.updateViewport(top, bottom, left, right, columns);
  }

  componentWillUnmount(): void {
    this.closeSubscription();
  }

  subscription?: dh.TableViewportSubscription;

  // eslint-disable-next-line class-methods-use-this
  getViewportRowRange = memoize(
    (table: dh.Table, top: number, bottom: number) => {
      const viewHeight = bottom - top;
      const viewportTop = Math.max(
        0,
        top - viewHeight * TableViewportUpdater.ROW_BUFFER_PAGES
      );
      const viewportBottom =
        bottom + viewHeight * TableViewportUpdater.ROW_BUFFER_PAGES;
      return [viewportTop, viewportBottom];
    }
  );

  // eslint-disable-next-line class-methods-use-this
  getViewportColumns = memoize(
    (
      table: dh.Table,
      left: number,
      right: number,
      movedColumns: MoveOperation[]
    ) => {
      if (left == null || right == null) {
        return null;
      }

      const viewWidth = right - left;
      const viewportLeft = Math.max(
        0,
        left - viewWidth * TableViewportUpdater.COLUMN_BUFFER_PAGES
      );
      const viewportRight = Math.min(
        right + viewWidth * TableViewportUpdater.COLUMN_BUFFER_PAGES,
        table.columns.length - 1
      );

      // Need to get all the columns from the table model now
      const columns = [];
      for (let i = viewportLeft; i <= viewportRight; i += 1) {
        const modelIndex = GridUtils.getModelIndex(i, movedColumns);
        columns.push(table.columns[modelIndex]);
      }

      return columns;
    }
  );

  closeSubscription(): void {
    log.debug2('closeSubscription', this.subscription);
    if (this.subscription) {
      this.subscription.close();
      this.subscription = undefined;

      const { onSubscription } = this.props;
      onSubscription();
    }

    this.updateViewport.cancel();
  }

  updateViewport = throttle(
    (
      top: number,
      bottom: number,
      left: number,
      right: number,
      viewColumns: dh.Column[]
    ): void => {
      if (bottom < top) {
        log.error('Invalid viewport', top, bottom);
        return;
      }

      if (top === 0 && bottom === 0) {
        log.debug2('Ignoring 0-0 viewport');
        return;
      }

      const { movedColumns, table } = this.props;
      const [viewportTop, viewportBottom] = this.getViewportRowRange(
        table,
        top,
        bottom
      );
      const columns =
        viewColumns ??
        this.getViewportColumns(table, left, right, movedColumns);
      log.debug2(
        'Setting Viewport Top:',
        viewportTop,
        'Bottom:',
        viewportBottom,
        'Columns:',
        columns
      );
      if (this.subscription == null) {
        log.debug2('updateViewport creating new subscription');
        this.subscription = table.setViewport(
          viewportTop,
          viewportBottom,
          columns
        );

        const { onSubscription } = this.props;
        onSubscription(this.subscription);
      } else {
        log.debug2('updateViewport using existing subscription');
        this.subscription.setViewport(viewportTop, viewportBottom, columns);
      }
    },
    UPDATE_THROTTLE
  );

  render(): null {
    return null;
  }
}

export default TableViewportUpdater;
