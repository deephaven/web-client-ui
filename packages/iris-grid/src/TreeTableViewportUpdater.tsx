import { PureComponent } from 'react';
import throttle from 'lodash.throttle';
import type {
  dh as DhType,
  EventListener,
  FilterCondition,
  RemoverFn,
  Sort,
  Table,
} from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

const log = Log.module('TreeTableViewportUpdater');

const UPDATE_THROTTLE = 150;

interface TreeTableViewportUpdaterProps {
  dh: DhType;
  table: Table;
  top: number;
  bottom: number;
  filters: FilterCondition[];
  sorts: Sort[];
  updateInterval: number;
  onViewportUpdate: EventListener;
}

/**
 * Updates the viewport of a TreeTable for use in a scroll pane.
 * Automatically throttles the viewport requests and buffers above and below.
 */
class TreeTableViewportUpdater extends PureComponent<
  TreeTableViewportUpdaterProps,
  Record<string, never>
> {
  static UPDATE_INTERVAL = 1000;

  static defaultProps = {
    top: 0,
    bottom: 0,
    onViewportUpdate: (): void => undefined,
    filters: [],
    sorts: [],
    updateInterval: TreeTableViewportUpdater.UPDATE_INTERVAL,
  };

  constructor(props: TreeTableViewportUpdaterProps) {
    super(props);

    this.listenerCleanup = null;
  }

  componentDidMount(): void {
    const { top, bottom, table, filters, sorts } = this.props;
    log.debug('componentDidMount', this.props);
    table.applyFilter(filters);
    table.applySort(sorts);
    this.updateViewport(top, bottom);
  }

  componentDidUpdate(prevProps: TreeTableViewportUpdaterProps): void {
    const { top, bottom, table, filters, sorts } = this.props;
    if (filters !== prevProps.filters) {
      log.debug('update table filter', filters);
      table.applyFilter(filters);
    }

    if (sorts !== prevProps.sorts) {
      log.debug('update table sort', sorts);
      table.applySort(sorts);
    }

    this.updateViewport(top, bottom);
  }

  componentWillUnmount(): void {
    this.updateViewport.cancel();
    if (this.listenerCleanup) {
      this.listenerCleanup();
    }
  }

  listenerCleanup: RemoverFn | null;

  updateViewport = throttle((top: number, bottom: number): void => {
    if (bottom < top) {
      log.error('Invalid viewport', top, bottom);
      return;
    }

    if (top === 0 && bottom === 0) {
      log.debug2('Ignoring 0-0 viewport');
      return;
    }

    const { table, updateInterval } = this.props;
    const viewSize = bottom - top;
    const viewportTop = Math.max(0, top - viewSize * 3);
    const viewportBottom = bottom + viewSize * 3 + 1;
    log.debug2(
      'Setting Viewport Top:',
      viewportTop,
      'Bottom:',
      viewportBottom,
      table
    );

    if (!this.listenerCleanup) {
      const { dh, onViewportUpdate } = this.props;
      this.listenerCleanup = table.addEventListener(
        dh.TreeTable.EVENT_UPDATED,
        onViewportUpdate
      );
    }

    table.setViewport(viewportTop, viewportBottom, undefined, updateInterval);
  }, UPDATE_THROTTLE);

  render(): null {
    return null;
  }
}

export default TreeTableViewportUpdater;
