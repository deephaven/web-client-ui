import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';

const log = Log.module('TreeTableViewportUpdater');

const UPDATE_THROTTLE = 150;

/**
 * Updates the viewport of a TreeTable for use in a scroll pane.
 * Automatically throttles the viewport requests and buffers above and below.
 */
class TreeTableViewportUpdater extends PureComponent {
  static UPDATE_INTERVAL = 1000;

  constructor(props) {
    super(props);

    this.updateViewport = throttle(
      this.updateViewport.bind(this),
      UPDATE_THROTTLE
    );

    this.listenerCleanup = null;
  }

  componentDidMount() {
    const { top, bottom, table, filters, sorts } = this.props;
    log.debug('componentDidMount', this.props);
    table.applyFilter(filters);
    table.applySort(sorts);
    this.updateViewport(top, bottom);
  }

  componentDidUpdate(prevProps) {
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

  componentWillUnmount() {
    this.updateViewport.cancel();
    if (this.listenerCleanup) {
      this.listenerCleanup();
    }
  }

  updateViewport(top, bottom) {
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

    table.setViewport(viewportTop, viewportBottom, null, updateInterval);
  }

  render() {
    return null;
  }
}

TreeTableViewportUpdater.propTypes = {
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

TreeTableViewportUpdater.defaultProps = {
  top: 0,
  bottom: 0,
  onViewportUpdate: () => {},
  filters: [],
  sorts: [],
  updateInterval: TreeTableViewportUpdater.UPDATE_INTERVAL,
};

export default TreeTableViewportUpdater;
