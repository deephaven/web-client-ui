import React, { Component, RefObject } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import debounce from 'lodash.debounce';
import deepEqual from 'deep-equal';
import memoize from 'memoizee';
import { DashboardPanelProps, LayoutUtils } from '@deephaven/dashboard';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  DateTimeColumnFormatter,
  Formatter,
  FormatterUtils,
  FormattingRule,
  TableUtils,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
  getActiveTool,
  getApi,
  getSettings,
  RootState,
} from '@deephaven/redux';
import { Pending, PromiseUtils } from '@deephaven/utils';
import DropdownFilter, {
  DropdownFilterColumn,
} from '../controls/dropdown-filter/DropdownFilter';
import { InputFilterEvent } from '../events';
import {
  getColumnsForDashboard,
  getColumnSelectionValidatorForDashboard,
  getIsolatedLinkerPanelIdForDashboard,
  getLinksForDashboard,
  getTableMapForDashboard,
} from '../redux';
import './DropdownFilterPanel.scss';
import ToolType from '../linker/ToolType';
import WidgetPanel from './WidgetPanel';
import type { Link, LinkPoint } from '../linker/LinkerUtils';
import { ColumnSelectionValidator } from '../linker/ColumnSelectionValidator';
import { PanelState as InputFilterPanelState } from './InputFilterPanel';

const log = Log.module('DropdownFilterPanel');

const DROPDOWN_FILTER_DEBOUNCE = 250;

interface PanelState {
  name?: string;
  type?: string;
  value?: string;
  isValueShown?: boolean;
  timestamp?: number;
}

type PanelTableMap = Map<string | string[], DhType.Table>;

type StateProps = {
  columns: DhType.Column[];
  columnSelectionValidator?: ColumnSelectionValidator;
  dashboardLinks: Link[];
  dh: typeof DhType;
  disableLinking: boolean;
  isLinkerActive: boolean;
  panelTableMap: PanelTableMap;
  panelState?: PanelState;
  settings: { formatter: FormattingRule[] };
};

type OwnProps = DashboardPanelProps;

const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
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
    dh: getApi(state),
    isLinkerActive,
    disableLinking,
    settings: getSettings(state),
    panelTableMap,
    dashboardLinks,
  };
};

const connector = connect(mapStateToProps, null, null, { forwardRef: true });

export type DropdownFilterPanelProps = OwnProps &
  StateProps &
  ConnectedProps<typeof connector>;

interface DropdownFilterPanelState {
  column?: DropdownFilterColumn;
  formatter: Formatter;
  valuesTable?: DhType.Table;
  valuesColumn?: DhType.Column;
  sourceSize: number;
  value: string;
  timestamp?: number;
  values: unknown[];
  isValueShown: boolean;
  wasFlipped: boolean;
  skipUpdate: boolean;

  panelState?: PanelState; // Dehydrated panel state that can load this panel

  isDisconnected: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  error: unknown | null;
}

export class DropdownFilterPanel extends Component<
  DropdownFilterPanelProps,
  DropdownFilterPanelState
> {
  static displayName = 'DropdownFilterPanel';

  static COMPONENT = 'DropdownFilterPanel';

  static MAX_TABLE_SIZE = 256;

  static SOURCE_COLUMN = Object.freeze({
    name: 'FilterSource',
    type: null,
  });

  constructor(props: DropdownFilterPanelProps) {
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

    const { dh, panelState, settings } = props;
    this.columnFormats = FormatterUtils.getColumnFormats(settings);
    // Filter dropdown needs to show and send full timestamp format with nanoseconds
    this.dateTimeFormatter = new DateTimeColumnFormatter(dh, {
      showTimeZone: false,
      showTSeparator: true,
      defaultDateTimeFormatString: `yyyy-MM-dd HH:mm:ss.SSSSSSSSS`,
    });
    const {
      value = '',
      isValueShown = false,
      name,
      type,
      timestamp,
    } = panelState ?? {};
    const column = name != null && type != null ? { name, type } : undefined;
    this.state = {
      column,
      formatter: new Formatter(dh, this.columnFormats),
      valuesTable: undefined,
      valuesColumn: undefined,
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

  componentDidMount(): void {
    this.updateValuesTable();
    const { dashboardLinks, panelTableMap } = this.props;
    const { column, value, timestamp } = this.state;
    const sourceTable = this.getSourceTable(panelTableMap, dashboardLinks);
    if (sourceTable !== null) {
      this.startListeningToSource(sourceTable);
    }
    if (column != null) {
      const { name, type } = column;
      this.sendUpdate(name, type, value, timestamp);
    }
  }

  componentDidUpdate(
    prevProps: DropdownFilterPanelProps,
    prevState: DropdownFilterPanelState
  ): void {
    const { dashboardLinks, panelTableMap, settings } = this.props;
    const { valuesTable } = this.state;
    const source = this.getSource(dashboardLinks);
    const sourceTable = this.getSourceTable(panelTableMap, dashboardLinks);

    const prevSource = this.getSource(prevProps.dashboardLinks);
    const prevSourceTable = this.getSourceTable(
      prevProps.panelTableMap,
      prevProps.dashboardLinks
    );

    if (settings !== prevProps.settings && settings !== undefined) {
      this.updateFormatterSettings(settings);
    }

    if (
      valuesTable !== prevState.valuesTable &&
      prevState.valuesTable != null
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

  componentWillUnmount(): void {
    const { dashboardLinks, panelTableMap } = this.props;
    const { valuesTable } = this.state;
    const sourceTable = this.getSourceTable(panelTableMap, dashboardLinks);
    this.pending.cancel();
    if (sourceTable !== null) {
      this.stopListeningToSource(sourceTable);
    }
    if (this.cleanup) {
      this.cleanup();
    }
    if (valuesTable != null) {
      valuesTable.close();
    }
  }

  dateTimeFormatter: DateTimeColumnFormatter;

  dropdownFilterRef: RefObject<DropdownFilter>;

  panelContainer: RefObject<HTMLDivElement>;

  pending: Pending;

  cleanup?: () => void;

  columnFormats?: FormattingRule[];

  getCachedValues = memoize(
    (
      rawValues: unknown[],
      { type, name }: DropdownFilterColumn,
      formatter: Formatter
    ) => {
      if (type !== undefined && TableUtils.isDateType(type)) {
        return rawValues.map(value =>
          this.dateTimeFormatter.format(value as number)
        );
      }
      return rawValues.map(value =>
        // Skip formatting for nulls so they don't get converted to ''
        value != null && type != null
          ? formatter.getFormattedString(value, type, name)
          : null
      );
    }
  );

  getCoordinateForColumn(): [number, number] | null {
    if (this.panelContainer.current == null) {
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

  getSettingsErrorMessage(): string | undefined {
    const { sourceSize } = this.state;
    if (sourceSize > DropdownFilterPanel.MAX_TABLE_SIZE) {
      return `Table too large, must have fewer than ${DropdownFilterPanel.MAX_TABLE_SIZE} options.`;
    }
    return undefined;
  }

  getPanelErrorMessage(): string | undefined {
    const { error } = this.state;
    return error != null ? `${error}` : undefined;
  }

  getCachedPanelLinks = memoize(
    (dashboardLinks: Link[], panel: DropdownFilterPanel) => {
      const panelId = LayoutUtils.getIdFromPanel(panel);
      log.debug('getCachedPanelLinks', dashboardLinks, panelId);
      return dashboardLinks.filter(link => link.end?.panelId === panelId);
    }
  );

  getCachedSource = memoize((links: Link[]) => {
    log.debug('getCachedSource', links);
    let source: LinkPoint | undefined;
    if (links.length > 0) {
      const [link] = links;
      source = link.start;
      if (links.length > 1) {
        log.error('Filter has more that one link', links);
      }
    }
    return source;
  });

  getCachedSourceTable = memoize(
    (
      panelTableMap: Map<string | string[], DhType.Table>,
      source: LinkPoint | undefined
    ) => {
      log.debug('getCachedSourceTable', panelTableMap, source);
      if (source == null) {
        return null;
      }
      const { panelId } = source;
      return panelTableMap.get(panelId) ?? null;
    }
  );

  getCachedSourceColumn = memoize(
    (table: DhType.Table, source: LinkPoint | undefined) => {
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
    }
  );

  getSource(links: Link[]): LinkPoint | undefined {
    const panelLinks = this.getCachedPanelLinks(links, this);
    return this.getCachedSource(panelLinks);
  }

  getSourceTable(
    panelTableMap: PanelTableMap,
    links: Link[]
  ): DhType.Table | null {
    const source = this.getSource(links);
    return this.getCachedSourceTable(panelTableMap, source);
  }

  getValuesColumn(
    valuesTable: DhType.Table,
    links: Link[]
  ): DhType.Column | null {
    const source = this.getSource(links);
    return this.getCachedSourceColumn(valuesTable, source);
  }

  startListeningToSource(sourceTable: DhType.Table): void {
    const { dh } = this.props;
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

  stopListeningToSource(sourceTable: DhType.Table): void {
    const { dh } = this.props;
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

  handleChange({
    column,
    isValueShown = false,
    value,
  }: {
    column: Partial<DhType.Column> | null;
    isValueShown?: boolean | undefined;
    value?: string | undefined;
  }): void {
    const { name = undefined, type = undefined } = column ?? {};
    let sendUpdate = true;
    let timestamp: number | undefined = Date.now();
    this.setState(
      ({ panelState, timestamp: prevTimestamp, wasFlipped, skipUpdate }) => {
        // If the user had a value set, and they flip the card over and flip it back without changing any settings, ignore it
        const isFlip =
          panelState != null &&
          isValueShown !== panelState.isValueShown &&
          name === panelState.name &&
          type === panelState.type &&
          value === panelState.value;
        sendUpdate =
          (!skipUpdate && isValueShown && (!isFlip || !wasFlipped)) ?? false;

        if (!sendUpdate) {
          timestamp = prevTimestamp;
        }

        return {
          panelState: {
            isValueShown,
            name,
            type,
            value,
            timestamp: timestamp ?? undefined,
          },
          timestamp,
          wasFlipped: isFlip,
          skipUpdate: false,
        };
      },
      () => {
        if (sendUpdate) {
          this.sendUpdate(name ?? null, type, value, timestamp);
        }
      }
    );
  }

  handleDisconnect(): void {
    this.setState({
      error: new Error('Table disconnected'),
      isDisconnected: true,
      isLoading: false,
    });
  }

  handleReconnect(): void {
    this.setState({ isDisconnected: false, error: null });
  }

  handleSourceFilterChange(): void {
    this.applySourceFilters();
  }

  handleSourceSortChange(): void {
    this.applySourceSorts();
  }

  handleSourceSizeChange({ detail }: { detail: number }): void {
    this.setState({ sourceSize: detail });
  }

  handleColumnSelected(): void {
    log.debug('handleColumnSelected');
    const { glEventHub } = this.props;
    glEventHub.emit(
      InputFilterEvent.COLUMN_SELECTED,
      this,
      DropdownFilterPanel.SOURCE_COLUMN
    );
  }

  handleClearAllFilters(): void {
    this.dropdownFilterRef?.current?.clearFilter();
  }

  /**
   * Set the filter value, card side, selected column
   * @param state Filter state to set
   * @param sendUpdate Emit filters changed event if true
   */
  setPanelState(state: InputFilterPanelState, sendUpdate = false): void {
    const { dashboardLinks } = this.props;
    if (this.getSource(dashboardLinks) == null) {
      log.debug('Ignore state update for unlinked filter', state);
      return;
    }
    // Set the skipUpdate flag so the next onChange handler call doesn't emit the FILTERS_CHANGED event
    this.setState({ skipUpdate: !sendUpdate });

    // Changing the inputFilter state via props doesn't quite work because of the delays on manual input changes
    // Setting the ref state directly triggers the onChange handler and updates the panelState
    this.dropdownFilterRef?.current?.setFilterState(state);
  }

  sendUpdate(
    name: string | null,
    type: string | undefined,
    value: string | undefined,
    timestamp?: number
  ): void {
    const { dashboardLinks, glEventHub } = this.props;
    const sourcePanelId = this.getSource(dashboardLinks)?.panelId;
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

  updateValuesTable(): void {
    const { dashboardLinks, panelTableMap } = this.props;
    const source = this.getSource(dashboardLinks);
    const sourceTable = this.getSourceTable(panelTableMap, dashboardLinks);
    log.debug('updateValuesTable', source, sourceTable);

    this.setState({
      values: [],
      valuesTable: undefined,
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
      .catch((error: unknown) => {
        if (PromiseUtils.isCanceled(error)) {
          return;
        }
        log.error(error);
        this.setState({ isLoading: false, error });
      });
  }

  applySourceSorts(): void {
    const { dashboardLinks, panelTableMap } = this.props;
    const { valuesTable } = this.state;
    const sourceTable = this.getSourceTable(panelTableMap, dashboardLinks);
    log.debug('applySourceSorts', sourceTable?.sort);
    if (valuesTable == null || sourceTable == null) {
      log.debug('Table not initialized');
      return;
    }
    const sorts = [...sourceTable.sort];
    valuesTable.applySort(sorts);
    this.setViewport(valuesTable);
  }

  applySourceFilters(): void {
    const { dashboardLinks, panelTableMap } = this.props;
    const { valuesTable } = this.state;
    const sourceTable = this.getSourceTable(panelTableMap, dashboardLinks);
    log.debug('applySourceFilters', sourceTable?.filter);
    if (valuesTable == null || sourceTable == null) {
      log.debug('Table not initialized');
      return;
    }
    const filters = [...sourceTable.filter];
    valuesTable.applyFilter(filters);
    this.setViewport(valuesTable);
  }

  updateViewportListener(valuesTable: DhType.Table): void {
    const { dh } = this.props;
    log.debug('updateViewportListener', valuesTable?.size);

    if (this.cleanup) {
      this.cleanup();
    }

    if (valuesTable == null) {
      this.cleanup = undefined;
      return;
    }

    this.cleanup = valuesTable.addEventListener(
      dh.Table.EVENT_UPDATED,
      this.handleValuesTableUpdate
    );

    this.setViewport(valuesTable);
  }

  setViewport(valuesTable: DhType.Table): void {
    const { dashboardLinks } = this.props;
    const valuesColumn = this.getValuesColumn(valuesTable, dashboardLinks);
    if (!valuesColumn) {
      log.error('values column is null');
      return;
    }
    valuesTable.setViewport(0, DropdownFilterPanel.MAX_TABLE_SIZE - 1, [
      valuesColumn,
    ]);
  }

  updateFormatterSettings(settings: {
    formatter?: FormattingRule[] | undefined;
  }): void {
    const { dh } = this.props;
    const columnFormats = FormatterUtils.getColumnFormats(settings);
    if (!deepEqual(this.columnFormats, columnFormats)) {
      this.columnFormats = columnFormats;
      this.setState({ formatter: new Formatter(dh, columnFormats) });
    }
  }

  handleValuesTableUpdate({
    detail,
  }: {
    detail: { rows: DhType.Row[] };
  }): void {
    const { rows } = detail;
    const { dashboardLinks } = this.props;
    const { valuesTable } = this.state;
    if (!valuesTable) {
      log.error('valuesTable is null');
      return;
    }
    const valuesColumn = this.getValuesColumn(valuesTable, dashboardLinks);
    if (!valuesColumn) {
      log.error('Values column not found');
      return;
    }
    const values = rows.map(row => row.get(valuesColumn));
    this.setState({ values, isLoading: false, isLoaded: true, valuesColumn });
  }

  handleSourceMouseEnter(): void {
    const { columnSelectionValidator } = this.props;
    if (!columnSelectionValidator) {
      return;
    }
    columnSelectionValidator(this, DropdownFilterPanel.SOURCE_COLUMN);
  }

  handleSourceMouseLeave(): void {
    const { columnSelectionValidator } = this.props;
    if (!columnSelectionValidator) {
      return;
    }
    columnSelectionValidator(this, undefined);
  }

  render(): React.ReactElement {
    const {
      columns,
      dashboardLinks,
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
    const source = this.getSource(dashboardLinks);
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

const ConnectedDropdownFilterPanel = connector(DropdownFilterPanel);

export default ConnectedDropdownFilterPanel;
