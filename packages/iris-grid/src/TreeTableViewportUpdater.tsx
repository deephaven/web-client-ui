import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import { DebouncedFunc } from 'lodash';
import dh, {
  EventListener,
  FilterCondition,
  RemoverFn,
  Sort,
  Table,
  TableViewportSubscription,
} from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';

const log = Log.module('TreeTableViewportUpdater');

const UPDATE_THROTTLE = 150;

interface TreeTableViewportUpdaterProps {
  table: Table;
  top: number;
  bottom: number;
  filters: FilterCondition[];
  sorts: Sort[];
  updateInterval: number;
  onViewportUpdate: EventListener;
}
interface TreeTableViewportUpdaterState {}
/**
 * Updates the viewport of a TreeTable for use in a scroll pane.
 * Automatically throttles the viewport requests and buffers above and below.
 */
class TreeTableViewportUpdater extends PureComponent<
  TreeTableViewportUpdaterProps,
  TreeTableViewportUpdaterState
> {
  propTypes = {
    table: PropTypes.shape({
      addEventListener: PropTypes.func.isRequired,
      applyFilter: PropTypes.func.isRequired,
      applySort: PropTypes.func.isRequired,
      setViewport: PropTypes.func.isRequired,
    }).isRequired,
    top: PropTypes.number,
    bottom: PropTypes.number,
    filters: PropTypes.arrayOf(PropTypes.shape({})),
    sorts: PropTypes.arrayOf(PropTypes.shape({})),
    updateInterval: PropTypes.number,
    onViewportUpdate: PropTypes.func,
  };

  static UPDATE_INTERVAL = 1000;

  listenerCleanup: RemoverFn | null;

  static defaultProps: {
    top: number;
    bottom: number;
    onViewportUpdate: () => void;
    filters: never[];
    sorts: never[];
    updateInterval: number;
  };

  updateViewport: DebouncedFunc<(top: number, bottom: number) => void>;

  constructor(props: TreeTableViewportUpdaterProps) {
    super(props);
    this.updateViewport = throttle(
      this._updateViewport.bind(this),
      UPDATE_THROTTLE
    );

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

  _updateViewport(top: number, bottom: number): void {
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
      const { onViewportUpdate } = this.props;
      this.listenerCleanup = table.addEventListener(
        dh.TreeTable.EVENT_UPDATED,
        onViewportUpdate
      );
    }

    table.setViewport(viewportTop, viewportBottom, undefined, updateInterval);
  }

  render() {
    return null;
  }
}

export default TreeTableViewportUpdater;
