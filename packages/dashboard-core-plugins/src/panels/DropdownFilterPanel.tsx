import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import deepEqual from 'deep-equal';
import memoize from 'memoize-one';
import { GLPropTypes, LayoutUtils } from '@deephaven/dashboard';
import dh from '@deephaven/jsapi-shim';
import {
  DateTimeColumnFormatter,
  Formatter,
  FormatterUtils,
  TableUtils,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { getActiveTool, getSettings } from '@deephaven/redux';
import { Pending, PromiseUtils } from '@deephaven/utils';
import DropdownFilter from '../controls/dropdown-filter/DropdownFilter';
import { InputFilterEvent } from '../events';
import {
  getColumnsForDashboard,
  getColumnSelectionValidatorForDashboard,
  getIsolatedLinkerPanelIdForDashboard,
  getLinksForDashboard,
  getTableMapForDashboard,
} from '../redux';
import './DropdownFilterPanel.scss';
import { UIPropTypes } from '../prop-types';
import ToolType from '../linker/ToolType';
import WidgetPanel from './WidgetPanel';

const log = Log.module('DropdownFilterPanel');

const DROPDOWN_FILTER_DEBOUNCE = 250;

class DropdownFilterPanel extends Component {
  static COMPONENT = 'DropdownFilterPanel';

  static MAX_TABLE_SIZE = 256;

  // Filter dropdown needs to show and send full timestamp format with nanoseconds
  static DATETIME_FORMATTER = new DateTimeColumnFormatter({
    showTimeZone: false,
    showTSeparator: true,
    defaultDateTimeFormatString: `yyyy-MM-dd HH:mm:ss.SSSSSSSSS`,
  });

  static SOURCE_COLUMN = Object.freeze({
    name: 'FilterSource',
    type: null,
  });

  constructor(props) {
    super(props);

    this.handleChange = debounce(
      this.handleChange.bind(this),
      DROPDOWN_FILTER_DEBOUNCE
    );
    this.handleClearAllFilters = this.handleClearAllFilters.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleReconnect = this.handleReconnect.bind(this);
    this.handleColumnSelected = this.handleColumnSelected.bind(this);
    this.handleSourceFilterChange = this.handleSourceFilterChange.bind(this);
    this.handleSourceSortChange = this.handleSourceSortChange.bind(this);
    this.handleSourceSizeChange = this.handleSourceSizeChange.bind(this);
    this.handleSourceMouseEnter = this.handleSourceMouseEnter.bind(this);
    this.handleSourceMouseLeave = this.handleSourceMouseLeave.bind(this);
    this.handleValuesTableUpdate = this.handleValuesTableUpdate.bind(this);

    this.dropdownFilterRef = React.createRef();
    this.panelContainer = React.createRef();
    this.pending = new Pending();
    this.cleanup = null;

    const { panelState, settings } = props;
    this.columnFormats = settings.columnFormats;
    const { value = '', isValueShown = false, name, type, timestamp = null } =
      panelState ?? {};
    const column = name != null && type != null ? { name, type } : null;
    this.state = {
      column,
      formatter: new Formatter(this.columnFormats),
      valuesTable: null,
      valuesColumn: null,
      sourceSize: 0,
      value,
      timestamp,
      values: [],
      isValueShown,
      wasFlipped: false,
      skipUpdate: false,

      // eslint-disable-next-line react/no-unused-state
      panelState, // Dehydrated panel state that can load this panel

      isDisconnected: false,
      isLoading: false,
      isLoaded: false,
      error: null,
    };
  }

  componentDidMount() {
    this.updateValuesTable();
    const { column, value, timestamp } = this.state;
    const sourceTable = this.getSourceTable();
    if (sourceTable !== null) {
      this.startListeningToSource(sourceTable);
    }
    if (column != null) {
      const { name, type } = column;
      this.sendUpdate(name, type, value, timestamp);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { valuesTable } = this.state;
    const { settings } = this.props;
    const source = this.getSource();
    const sourceTable = this.getSourceTable();
    const prevSource = this.getSource(prevProps);
    const prevSourceTable = this.getSourceTable(prevProps);

    if (settings !== prevProps.settings) {
      this.updateFormatterSettings(settings);
    }

    if (
      valuesTable !== prevState.valuesTable &&
      prevState.valuesTable !== null
    ) {
      log.debug('Table in state modified, closing the old table.');
      prevState.valuesTable.close();
    }

    // Checking source change in addition to table change
    // in case a different column is selected in the same table
    if (sourceTable !== prevSourceTable || source !== prevSource) {
      this.updateValuesTable();
    }

    if (sourceTable !== prevSourceTable) {
      if (prevSourceTable !== null) {
        this.stopListeningToSource(prevSourceTable);
      }
      if (sourceTable !== null) {
        this.startListeningToSource(sourceTable);
      }
    }
  }

  componentWillUnmount() {
    const { valuesTable } = this.state;
    const sourceTable = this.getSourceTable();
    this.pending.cancel();
    if (sourceTable !== null) {
      this.stopListeningToSource(sourceTable);
    }
    if (this.cleanup) {
      this.cleanup();
    }
    if (valuesTable !== null) {
      valuesTable.close();
    }
  }

  getCachedValues = memoize((rawValues, { type, name }, formatter) => {
    if (TableUtils.isDateType(type)) {
      return rawValues.map(value =>
        DropdownFilterPanel.DATETIME_FORMATTER.format(value)
      );
    }
    return rawValues.map(value =>
      // Skip formatting for nulls so they don't get converted to ''
      value != null ? formatter.getFormattedString(value, type, name) : null
    );
  });

  getCoordinateForColumn() {
    if (!this.panelContainer.current) {
      return null;
    }

    const element = this.panelContainer.current.querySelector(
      `.${DropdownFilter.SOURCE_BUTTON_CLASS_NAME}`
    );
    const rect = element?.getBoundingClientRect() ?? null;
    if (rect == null || rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    const x = rect.left + rect.width / 2;
    const y = rect.bottom;
    return [x, y];
  }

  getSettingsErrorMessage() {
    const { sourceSize } = this.state;
    if (sourceSize > DropdownFilterPanel.MAX_TABLE_SIZE) {
      return `Table too large, must have fewer than ${DropdownFilterPanel.MAX_TABLE_SIZE} options.`;
    }
    return null;
  }

  getPanelErrorMessage() {
    const { error } = this.state;
    return error ? `${error}` : null;
  }

  getCachedPanelLinks = memoize((dashboardLinks, panel) => {
    const panelId = LayoutUtils.getIdFromPanel(panel);
    log.debug('getCachedPanelLinks', dashboardLinks, panelId);
    return dashboardLinks.filter(link => link.end?.panelId === panelId);
  });

  getCachedSource = memoize(links => {
    log.debug('getCachedSource', links);
    let source = null;
    if (links.length > 0) {
      const [link] = links;
      source = link.start;
      if (links.length > 1) {
        log.error('Filter has more that one link', links);
      }
    }
    return source;
  });

  getCachedSourceTable = memoize((panelTableMap, source) => {
    log.debug('getCachedSourceTable', panelTableMap, source);
    if (source == null) {
      return null;
    }
    const { panelId } = source;
    return panelTableMap.get(panelId) ?? null;
  });

  getCachedSourceColumn = memoize((table, source) => {
    log.debug('getCachedSourceColumn', table, source);
    if (table == null || source == null) {
      return null;
    }
    return (
      table.columns.find(
        ({ name, type }) =>
          name === source.columnName && type === source.columnType
      ) ?? null
    );
  });

  getSource(props = this.props) {
    const { dashboardLinks } = props;
    const panelLinks = this.getCachedPanelLinks(dashboardLinks, this);
    return this.getCachedSource(panelLinks);
  }

  getSourceTable(props = this.props) {
    const { panelTableMap } = props;
    const source = this.getSource(props);
    return this.getCachedSourceTable(panelTableMap, source);
  }

  getValuesColumn(valuesTable) {
    const source = this.getSource();
    return this.getCachedSourceColumn(valuesTable, source);
  }

  startListeningToSource(sourceTable) {
    log.debug('startListeningToSource');
    sourceTable.addEventListener(
      dh.Table.EVENT_FILTERCHANGED,
      this.handleSourceFilterChange
    );
    sourceTable.addEventListener(
      dh.Table.EVENT_SORTCHANGED,
      this.handleSourceSortChange
    );
    sourceTable.addEventListener(
      dh.Table.EVENT_SIZECHANGED,
      this.handleSourceSizeChange
    );
    sourceTable.addEventListener(
      dh.Table.EVENT_DISCONNECT,
      this.handleDisconnect
    );
    sourceTable.addEventListener(
      dh.Table.EVENT_RECONNECT,
      this.handleReconnect
    );
  }

  stopListeningToSource(sourceTable) {
    log.debug('stopListeningToSource');
    sourceTable.removeEventListener(
      dh.Table.EVENT_FILTERCHANGED,
      this.handleSourceFilterChange
    );
    sourceTable.removeEventListener(
      dh.Table.EVENT_SORTCHANGED,
      this.handleSourceSortChange
    );
    sourceTable.removeEventListener(
      dh.Table.EVENT_SIZECHANGED,
      this.handleSourceSizeChange
    );
    sourceTable.removeEventListener(
      dh.Table.EVENT_DISCONNECT,
      this.handleDisconnect
    );
    sourceTable.removeEventListener(
      dh.Table.EVENT_RECONNECT,
      this.handleReconnect
    );
  }

  handleChange({ column, isValueShown, value }) {
    const { name = null, type = null } = column ?? {};
    let sendUpdate = true;
    let timestamp = Date.now();
    this.setState(
      ({ panelState, timestamp: prevTimestamp, wasFlipped, skipUpdate }) => {
        // If the user had a value set, and they flip the card over and flip it back without changing any settings, ignore it
        const isFlip =
          panelState != null &&
          isValueShown !== panelState.isValueShown &&
          name === panelState.name &&
          type === panelState.type &&
          value === panelState.value;
        sendUpdate = !skipUpdate && isValueShown && (!isFlip || !wasFlipped);

        if (!sendUpdate) {
          timestamp = prevTimestamp;
        }

        return {
          panelState: {
            isValueShown,
            name,
            type,
            value,
            timestamp,
          },
          timestamp,
          wasFlipped: isFlip,
          skipUpdate: false,
        };
      },
      () => {
        if (sendUpdate) {
          this.sendUpdate(name, type, value, timestamp);
        }
      }
    );
  }

  handleDisconnect() {
    this.setState({
      error: new Error('Table disconnected'),
      isDisconnected: true,
      isLoading: false,
    });
  }

  handleReconnect() {
    this.setState({ isDisconnected: false, error: null });
  }

  handleSourceFilterChange() {
    this.applySourceFilters();
  }

  handleSourceSortChange() {
    this.applySourceSorts();
  }

  handleSourceSizeChange({ detail }) {
    this.setState({ sourceSize: detail });
  }

  handleColumnSelected() {
    log.debug('handleColumnSelected');
    const { glEventHub } = this.props;
    glEventHub.emit(
      InputFilterEvent.COLUMN_SELECTED,
      this,
      DropdownFilterPanel.SOURCE_COLUMN
    );
  }

  handleClearAllFilters() {
    this.dropdownFilterRef.current.clearFilter();
  }

  /**
   * Set the filter value, card side, selected column
   * @param {Object} state Filter state to set
   * @param {boolean} sendUpdate Emit filters changed event if true
   */
  setPanelState(state, sendUpdate = false) {
    if (this.getSource() == null) {
      log.debug('Ignore state update for unlinked filter', state);
      return;
    }
    // Set the skipUpdate flag so the next onChange handler call doesn't emit the FILTERS_CHANGED event
    this.setState({ skipUpdate: !sendUpdate });

    // Changing the inputFilter state via props doesn't quite work because of the delays on manual input changes
    // Setting the ref state directly triggers the onChange handler and updates the panelState
    this.dropdownFilterRef.current?.setFilterState(state);
  }

  sendUpdate(name, type, value, timestamp) {
    const { glEventHub } = this.props;
    const sourcePanelId = this.getSource()?.panelId;
    const excludePanelIds = sourcePanelId === null ? [] : [sourcePanelId];
    log.debug('sendUpdate', {
      name,
      type,
      value,
      timestamp,
      excludePanelIds,
    });

    glEventHub.emit(InputFilterEvent.FILTERS_CHANGED, this, {
      name,
      type,
      value: value != null ? value : '=null',
      timestamp,
      excludePanelIds,
    });
  }

  updateValuesTable() {
    const source = this.getSource();
    const sourceTable = this.getSourceTable();
    log.debug('updateValuesTable', source, sourceTable);

    this.setState({
      values: [],
      valuesTable: null,
      error: null,
    });

    if (source == null) {
      log.debug('Filter unlinked.');
      this.setState({
        isLoading: false,
        isLoaded: true,
        isValueShown: false,
        sourceSize: 0,
      });
      return;
    }

    this.setState({ isLoading: true });

    if (sourceTable == null) {
      return;
    }

    this.setState({ isLoaded: false, sourceSize: sourceTable.size });

    this.pending
      .add(sourceTable.copy(), resolved => resolved.close())
      .then(valuesTable => {
        // Loading/loaded will be set when values array is actually populated
        this.updateViewportListener(valuesTable);
        this.setState({ valuesTable });
      })
      .catch(error => {
        if (PromiseUtils.isCancelled(error)) {
          return;
        }
        log.error(error);
        this.setState({ isLoading: false, error });
      });
  }

  applySourceSorts() {
    const { valuesTable } = this.state;
    const sourceTable = this.getSourceTable();
    log.debug('applySourceSorts', sourceTable.sort);
    if (valuesTable == null) {
      log.debug('Table not initialized');
      return;
    }
    const sorts = [...sourceTable.sort];
    valuesTable.applySort(sorts);
    this.setViewport(valuesTable);
  }

  applySourceFilters() {
    const { valuesTable } = this.state;
    const sourceTable = this.getSourceTable();
    log.debug('applySourceFilters', sourceTable.filter);
    if (valuesTable == null) {
      log.debug('Table not initialized');
      return;
    }
    const filters = [...sourceTable.filter];
    valuesTable.applyFilter(filters);
    this.setViewport(valuesTable);
  }

  updateViewportListener(valuesTable) {
    log.debug('updateViewportListener', valuesTable?.size);

    if (this.cleanup) {
      this.cleanup();
    }

    if (valuesTable == null) {
      this.cleanup = null;
      return;
    }

    this.cleanup = valuesTable.addEventListener(
      dh.Table.EVENT_UPDATED,
      this.handleValuesTableUpdate
    );

    this.setViewport(valuesTable);
  }

  setViewport(valuesTable) {
    const valuesColumn = this.getValuesColumn(valuesTable);
    valuesTable.setViewport(0, DropdownFilterPanel.MAX_TABLE_SIZE - 1, [
      valuesColumn,
    ]);
  }

  updateFormatterSettings(settings) {
    const columnFormats = FormatterUtils.getColumnFormats(settings);
    if (!deepEqual(this.columnFormats, columnFormats)) {
      this.columnFormats = columnFormats;
      this.setState({ formatter: new Formatter(columnFormats) });
    }
  }

  handleValuesTableUpdate({ detail }) {
    const { rows } = detail;
    const { valuesTable } = this.state;
    const valuesColumn = this.getValuesColumn(valuesTable);
    if (!valuesColumn) {
      log.error('Values column not found');
      return;
    }
    const values = rows.map(row => row.get(valuesColumn));
    this.setState({ values, isLoading: false, isLoaded: true, valuesColumn });
  }

  handleSourceMouseEnter() {
    const { columnSelectionValidator } = this.props;
    if (!columnSelectionValidator) {
      return;
    }
    columnSelectionValidator(this, DropdownFilterPanel.SOURCE_COLUMN);
  }

  handleSourceMouseLeave() {
    const { columnSelectionValidator } = this.props;
    if (!columnSelectionValidator) {
      return;
    }
    columnSelectionValidator(this, null);
  }

  render() {
    const {
      columns,
      disableLinking,
      glContainer,
      glEventHub,
      isLinkerActive,
    } = this.props;
    const {
      column,
      formatter,
      isDisconnected,
      isValueShown,
      value,
      values,
      valuesColumn,
      isLoading,
      isLoaded,
    } = this.state;

    const source = this.getSource();
    const settingsErrorMessage = this.getSettingsErrorMessage();
    const panelErrorMessage = this.getPanelErrorMessage();
    const formattedValues =
      isLoaded && valuesColumn != null
        ? this.getCachedValues(values, valuesColumn, formatter)
        : [];

    return (
      <WidgetPanel
        errorMessage={panelErrorMessage}
        isLoading={isLoading}
        isLoaded={isLoaded}
        isDisconnected={isDisconnected}
        className="iris-dropdown-filter-panel"
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onClearAllFilters={this.handleClearAllFilters}
        widgetName="Dropdown Filter"
        widgetType="DropdownFilter"
      >
        <div
          ref={this.panelContainer}
          className="dropdown-filter-container h-100 w-100 container"
        >
          <DropdownFilter
            ref={this.dropdownFilterRef}
            column={column}
            columns={columns}
            isValueShown={isValueShown}
            isLinkerActive={isLinkerActive}
            disableLinking={disableLinking}
            isLoaded={isLoaded}
            settingsError={settingsErrorMessage}
            source={source}
            value={value}
            values={formattedValues}
            onChange={this.handleChange}
            onColumnSelected={this.handleColumnSelected}
            onSourceMouseEnter={this.handleSourceMouseEnter}
            onSourceMouseLeave={this.handleSourceMouseLeave}
          />
        </div>
      </WidgetPanel>
    );
  }
}

DropdownFilterPanel.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  panelState: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    value: PropTypes.string,
    isValueShown: PropTypes.bool,
  }),
  isLinkerActive: PropTypes.bool.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  columnSelectionValidator: PropTypes.func,
  disableLinking: PropTypes.bool.isRequired,
  settings: PropTypes.shape({
    columnFormats: PropTypes.arrayOf(PropTypes.shape({})),
  }).isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  panelTableMap: PropTypes.instanceOf(Map).isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  dashboardLinks: UIPropTypes.Links.isRequired,
};

DropdownFilterPanel.defaultProps = {
  columnSelectionValidator: null,
  panelState: null,
};

DropdownFilterPanel.displayName = 'DropdownFilterPanel';

const mapStateToProps = (state, ownProps) => {
  const { localDashboardId } = ownProps;
  const panelId = LayoutUtils.getIdFromPanel({ props: ownProps });
  const panelTableMap = getTableMapForDashboard(state, localDashboardId);
  const dashboardLinks = getLinksForDashboard(state, localDashboardId);
  const activeTool = getActiveTool(state);
  const isolatedLinkerPanelId = getIsolatedLinkerPanelIdForDashboard(
    state,
    localDashboardId
  );
  const isLinkerActive =
    activeTool === ToolType.LINKER &&
    (isolatedLinkerPanelId === undefined || isolatedLinkerPanelId === panelId);
  // Disable linking if linker is in isolated mode for a different panel
  const disableLinking =
    activeTool === ToolType.LINKER &&
    isolatedLinkerPanelId !== undefined &&
    isolatedLinkerPanelId !== panelId;

  return {
    columns: getColumnsForDashboard(state, localDashboardId),
    columnSelectionValidator: getColumnSelectionValidatorForDashboard(
      state,
      localDashboardId
    ),
    isLinkerActive,
    disableLinking,
    settings: getSettings(state),
    panelTableMap,
    dashboardLinks,
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  DropdownFilterPanel
);
