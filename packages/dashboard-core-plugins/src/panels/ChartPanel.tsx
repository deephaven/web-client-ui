import React, { Component, ReactElement, RefObject } from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';
import debounce from 'lodash.debounce';
import {
  Chart,
  ChartModel,
  ChartModelSettings,
  ChartUtils,
  isFigureChartModel,
} from '@deephaven/chart';
import {
  getOpenedPanelMapForDashboard,
  LayoutUtils,
  PanelComponent,
  PanelProps,
} from '@deephaven/dashboard';
import { IrisGridUtils, InputFilter, ColumnName } from '@deephaven/iris-grid';
import dh, {
  FigureDescriptor,
  SeriesPlotStyle,
  TableTemplate,
} from '@deephaven/jsapi-shim';
import { ThemeExport } from '@deephaven/components';
import Log from '@deephaven/log';
import {
  getActiveTool,
  getSettings,
  RootState,
  setActiveTool as setActiveToolAction,
  WorkspaceSettings,
} from '@deephaven/redux';
import {
  assertNotNull,
  Pending,
  PromiseUtils,
  TextUtils,
} from '@deephaven/utils';
import GoldenLayout from '@deephaven/golden-layout';
import WidgetPanel from './WidgetPanel';
import ToolType from '../linker/ToolType';
import { InputFilterEvent, ChartEvent } from '../events';
import {
  getColumnSelectionValidatorForDashboard,
  getInputFiltersForDashboard,
  getIsolatedLinkerPanelIdForDashboard,
  getLinksForDashboard,
  getTableMapForDashboard,
  setDashboardIsolatedLinkerPanelId as setDashboardIsolatedLinkerPanelIdAction,
} from '../redux';
import ChartFilterOverlay, { ColumnMap } from './ChartFilterOverlay';
import ChartColumnSelectorOverlay, {
  SelectorColumn,
} from './ChartColumnSelectorOverlay';
import './ChartPanel.scss';
import { Link } from '../linker/LinkerUtils';
import { PanelState as IrisGridPanelState } from './IrisGridPanel';
import { ColumnSelectionValidator } from '../linker/ColumnSelectionValidator';

const log = Log.module('ChartPanel');
const UPDATE_MODEL_DEBOUNCE = 150;

export type InputFilterMap = Map<string, InputFilter>;

export type FilterMap = Map<string, string>;

export type LinkedColumnMap = Map<string, { name: string; type: string }>;

export interface ChartPanelMetaData {
  figure: string;
  table: string;
  query: string;
  querySerial: string;
  sourcePanelId: string;
  settings: {
    isLinked: boolean;
    title: string;
    xAxis: string;
    series: string[];
    type: keyof SeriesPlotStyle;
  };
}

type Settings = Record<string, unknown>;

interface PanelState {
  filterValueMap: [string, string][];
  settings: Partial<ChartModelSettings>;
  tableSettings: unknown;
  irisGridState?: {
    advancedFilters: unknown;
    quickFilters: unknown;
    sorts: unknown;
  };
  irisGridPanelState?: {
    partitionColumn: string;
    partition: unknown;
  };
}
interface ChartPanelProps {
  glContainer: GoldenLayout.Container;
  glEventHub: GoldenLayout.EventEmitter;

  metadata: ChartPanelMetaData;
  /** Function to build the ChartModel used by this ChartPanel. Can return a promise. */
  makeModel: () => ChartModel;
  inputFilters: InputFilter[];
  links: Link[];
  localDashboardId: string;
  isLinkerActive: boolean;
  source?: TableTemplate;
  sourcePanel?: PanelComponent;
  columnSelectionValidator?: ColumnSelectionValidator;
  setActiveTool: (tool: string) => void;
  setDashboardIsolatedLinkerPanelId: (
    id: string,
    secondParam: undefined
  ) => void;

  panelState: PanelState;
  settings: Partial<WorkspaceSettings>;
}

interface ChartPanelState {
  settings: Partial<ChartModelSettings>;
  error?: unknown;
  isActive: boolean;
  isDisconnected: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  isLinked: boolean;

  // Map of all non-empty filters applied to the chart.
  // Initialize the filter map to the previously stored values; input filters will be applied after load.
  filterMap: Map<string, string>;
  // Map of filter values set from links, stored in panelState.
  // Combined with inputFilters to get applied filters (filterMap).
  filterValueMap: Map<string, string>;
  model?: ChartModel;
  columnMap: ColumnMap;

  // eslint-disable-next-line react/no-unused-state
  panelState: PanelState;
}

function hasInputFilter(
  panel: PanelProps
): panel is PanelProps & { inputFilters: InputFilter[] } {
  return (
    (panel as PanelProps & { inputFilters: InputFilter[] }).inputFilters != null
  );
}

function hasPanelState(
  panel: unknown
): panel is { panelState: IrisGridPanelState } {
  return (panel as { panelState: IrisGridPanelState }).panelState != null;
}

export class ChartPanel extends Component<ChartPanelProps, ChartPanelState> {
  static defaultProps = {
    columnSelectionValidator: null,
    isLinkerActive: false,
    source: null,
    sourcePanel: null,
    panelState: null,
    settings: {},
  };

  static displayName = 'ChartPanel';

  static COMPONENT = 'ChartPanel';

  constructor(props: ChartPanelProps) {
    super(props);

    this.handleColumnSelected = this.handleColumnSelected.bind(this);
    this.handleColumnMouseEnter = this.handleColumnMouseEnter.bind(this);
    this.handleColumnMouseLeave = this.handleColumnMouseLeave.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleReconnect = this.handleReconnect.bind(this);
    this.handleFilterAdd = this.handleFilterAdd.bind(this);
    this.handleHide = this.handleHide.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleLoadError = this.handleLoadError.bind(this);
    this.handleLoadSuccess = this.handleLoadSuccess.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleSettingsChanged = this.handleSettingsChanged.bind(this);
    this.handleOpenLinker = this.handleOpenLinker.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handleSourceColumnChange = this.handleSourceColumnChange.bind(this);
    this.handleSourceFilterChange = this.handleSourceFilterChange.bind(this);
    this.handleSourceSortChange = this.handleSourceSortChange.bind(this);
    this.handleTabBlur = this.handleTabBlur.bind(this);
    this.handleTabFocus = this.handleTabFocus.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.updateModelFromSource = debounce(
      this.updateModelFromSource.bind(this),
      UPDATE_MODEL_DEBOUNCE
    );
    this.handleClearAllFilters = this.handleClearAllFilters.bind(this);

    this.panelContainer = React.createRef();
    this.chart = React.createRef();
    this.pending = new Pending();

    const { metadata, panelState } = props;
    const { filterValueMap = [], settings = {} } = panelState ?? {};

    this.state = {
      settings,
      error: undefined,
      isActive: false,
      isDisconnected: false,
      isLoading: false,
      isLoaded: false,
      isLinked: metadata && metadata.settings && metadata.settings.isLinked,

      // Map of all non-empty filters applied to the chart.
      // Initialize the filter map to the previously stored values; input filters will be applied after load.
      filterMap: new Map(filterValueMap),
      // Map of filter values set from links, stored in panelState.
      // Combined with inputFilters to get applied filters (filterMap).
      filterValueMap: new Map(filterValueMap),
      model: undefined,
      columnMap: new Map(),

      // eslint-disable-next-line react/no-unused-state
      panelState,
    };
  }

  componentDidMount(): void {
    if (!this.isHidden()) {
      this.setState({ isActive: true });
      this.initModel();
    }
  }

  componentDidUpdate(
    prevProps: ChartPanelProps,
    prevState: ChartPanelState
  ): void {
    const { inputFilters, source } = this.props;
    const {
      columnMap,
      model,
      filterMap,
      filterValueMap,
      isLinked,
      settings,
    } = this.state;

    if (!model) {
      return;
    }

    if (columnMap !== prevState.columnMap) {
      this.pruneFilterMaps();
    }

    if (inputFilters !== prevProps.inputFilters) {
      this.updateChangedInputFilters(inputFilters, prevProps.inputFilters);
    }

    if (filterMap !== prevState.filterMap) {
      this.updateFilters();
    } else if (filterValueMap !== prevState.filterValueMap) {
      this.updatePanelState();
    }

    if (settings !== prevState.settings && isFigureChartModel(model)) {
      model.updateSettings(settings);
      this.updatePanelState();
    }

    if (isLinked !== prevState.isLinked) {
      if (source) {
        if (isLinked) {
          this.startListeningToSource(source);
          this.updateModelFromSource();
        } else {
          this.stopListeningToSource(source);
        }
      }
    } else if (isLinked && source !== prevProps.source) {
      if (prevProps.source) {
        this.stopListeningToSource(prevProps.source);
      }
      if (source) {
        this.startListeningToSource(source);
        this.updateModelFromSource();
      }
    }
  }

  componentWillUnmount(): void {
    this.pending.cancel();

    const { source } = this.props;
    if (source) {
      this.stopListeningToSource(source);
    }
  }

  panelContainer: RefObject<HTMLDivElement>;

  chart: RefObject<Chart>;

  pending: Pending;

  initModel(): void {
    this.setState({ isLoading: true, isLoaded: false, error: undefined });

    const { makeModel } = this.props;
    this.pending
      .add(makeModel(), resolved => {
        resolved.close();
      })
      .then(this.handleLoadSuccess, this.handleLoadError);
  }

  getWaitingInputMap = memoize(
    (
      isFilterRequired: boolean,
      columnMap: ColumnMap,
      filterMap: FilterMap
    ): Map<string, { name: string; type: string }> => {
      if (!isFilterRequired) {
        return new Map();
      }
      const waitingInputMap = new Map(columnMap);
      filterMap.forEach((filter, name) => {
        waitingInputMap.delete(name);
      });
      return waitingInputMap;
    }
  );

  getWaitingFilterMap = memoize(
    (
      isFilterRequired: boolean,
      columnMap: ColumnMap,
      filterMap: FilterMap,
      linkedColumnMap: LinkedColumnMap,
      inputFilterMap: InputFilterMap
    ) => {
      if (!isFilterRequired) {
        return new Map();
      }

      const waitingFilterMap = new Map(columnMap);
      filterMap.forEach((filter, name) => {
        waitingFilterMap.delete(name);
      });
      inputFilterMap.forEach((value, name) => {
        waitingFilterMap.delete(name);
      });
      linkedColumnMap.forEach((column, name) => {
        waitingFilterMap.delete(name);
      });
      return waitingFilterMap;
    }
  );

  getInputFilterColumnMap = memoize(
    (columnMap: ColumnMap, inputFilters: InputFilter[]) => {
      const inputFilterMap = new Map<string, InputFilter>();
      for (let i = 0; i < inputFilters.length; i += 1) {
        const inputFilter = inputFilters[i];
        const { name, type } = inputFilter;
        const column = columnMap.get(name);
        if (column != null && column.type === type) {
          inputFilterMap.set(name, inputFilter);
        }
      }
      return inputFilterMap;
    }
  );

  getLinkedColumnMap = memoize((columnMap: ColumnMap, links: Link[]) => {
    const linkedColumnMap = new Map<string, { name: string; type: string }>();
    const panelId = LayoutUtils.getIdFromPanel(this);
    for (let i = 0; i < links.length; i += 1) {
      const link = links[i];
      let columnName = null;
      if (
        link.start &&
        link.start.panelId === panelId &&
        columnMap.has(link.start.columnName)
      ) {
        columnName = link.start.columnName;
      } else if (
        link.end &&
        link.end.panelId === panelId &&
        columnMap.has(link.end.columnName)
      ) {
        columnName = link.end.columnName;
      }

      if (columnName != null && columnMap.has(columnName)) {
        const column = columnMap.get(columnName);
        assertNotNull(column);
        linkedColumnMap.set(columnName, column);
      }
    }
    return linkedColumnMap;
  });

  getSelectorColumns = memoize(
    (
      columnMap: ColumnMap,
      linkedColumnMap: LinkedColumnMap,
      columnSelectionValidator?: ColumnSelectionValidator
    ) =>
      Array.from(columnMap.values()).map(column => ({
        name: column.name,
        type: column.type,
        isValid: columnSelectionValidator
          ? columnSelectionValidator(this, column)
          : false,
        isActive: linkedColumnMap.has(column.name),
      }))
  );

  startListeningToSource(table: TableTemplate): void {
    log.debug('startListeningToSource', table);

    table.addEventListener(
      dh.Table.EVENT_CUSTOMCOLUMNSCHANGED,
      this.handleSourceColumnChange
    );
    table.addEventListener(
      dh.Table.EVENT_FILTERCHANGED,
      this.handleSourceFilterChange
    );
    table.addEventListener(
      dh.Table.EVENT_SORTCHANGED,
      this.handleSourceSortChange
    );
  }

  stopListeningToSource(table: TableTemplate): void {
    log.debug('stopListeningToSource', table);

    table.removeEventListener(
      dh.Table.EVENT_CUSTOMCOLUMNSCHANGED,
      this.handleSourceColumnChange
    );
    table.removeEventListener(
      dh.Table.EVENT_FILTERCHANGED,
      this.handleSourceFilterChange
    );
    table.removeEventListener(
      dh.Table.EVENT_SORTCHANGED,
      this.handleSourceSortChange
    );
  }

  loadModelIfNecessary(): void {
    const { isActive, isLoaded, isLoading } = this.state;
    if (isActive && !isLoaded && !isLoading) {
      this.initModel();
    }
  }

  isHidden(): boolean {
    const { glContainer } = this.props;
    const { isHidden } = glContainer;
    return isHidden;
  }

  handleColumnSelected(columnName: string): void {
    const { glEventHub } = this.props;
    const { columnMap } = this.state;
    glEventHub.emit(
      ChartEvent.COLUMN_SELECTED,
      this,
      columnMap.get(columnName)
    );
  }

  handleColumnMouseEnter({ type, name }: SelectorColumn): void {
    const { columnSelectionValidator } = this.props;
    log.debug('handleColumnMouseEnter', columnSelectionValidator, type, name);
    if (!columnSelectionValidator) {
      return;
    }
    columnSelectionValidator(this, { type, name });
  }

  handleColumnMouseLeave(): void {
    const { columnSelectionValidator } = this.props;
    log.debug('handleColumnMouseLeave', columnSelectionValidator);
    if (!columnSelectionValidator) {
      return;
    }
    columnSelectionValidator(this, undefined);
  }

  handleDisconnect(): void {
    this.setState({
      error: new Error('Figure disconnected'),
      isDisconnected: true,
    });
  }

  handleFilterAdd(columns: InputFilter[]): void {
    for (let i = 0; i < columns.length; i += 1) {
      this.openInputFilter(columns[i]);
    }
  }

  handleOpenLinker(): void {
    const {
      localDashboardId,
      setActiveTool,
      setDashboardIsolatedLinkerPanelId,
    } = this.props;
    setDashboardIsolatedLinkerPanelId(localDashboardId, undefined);
    setActiveTool(ToolType.LINKER);
  }

  handleReconnect(): void {
    this.setState({ isDisconnected: false, error: undefined });
    this.sendColumnChange();
    this.updateColumnFilters();
  }

  handleLoadSuccess(model: ChartModel): void {
    log.debug('handleLoadSuccess');

    const { model: prevModel } = this.state;
    this.setState(
      {
        model,
        isLoaded: true,
      },
      () => {
        const { inputFilters, source } = this.props;
        const { filterMap, isLinked } = this.state;
        if (model !== prevModel) {
          this.sendColumnChange();
          this.updateColumnFilters();
          this.updateInputFilters(
            inputFilters,
            filterMap.size > 0 || model.isFilterRequired()
          );
          if (source && isLinked) {
            this.startListeningToSource(source);
            this.updateModelFromSource();
          }
        }
      }
    );
  }

  handleLoadError(error: unknown): void {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }

    log.error('handleLoadError', error);
    this.setState({ error, isLoading: false });
  }

  handleSourceColumnChange(): void {
    this.updateModelFromSource();
  }

  handleSourceFilterChange(): void {
    this.updateModelFromSource();
  }

  handleSourceSortChange(): void {
    this.updateModelFromSource();
  }

  updateModelFromSource(): void {
    const { metadata, source } = this.props;
    const { isLinked, model } = this.state;
    const { settings } = metadata;
    if (!isLinked || !model || !source) {
      log.debug2('updateModelFromSource ignoring', isLinked, model, source);
      return;
    }

    // By now the model has already been loaded, which is the only other cancelable thing in pending
    this.pending.cancel();
    this.pending
      .add(
        dh.plot.Figure.create(
          (ChartUtils.makeFigureSettings(
            settings,
            source
          ) as unknown) as FigureDescriptor
        )
      )
      .then(figure => {
        if (isFigureChartModel(model)) {
          model.setFigure(figure);
        }
      })
      .catch(this.handleLoadError);

    this.updatePanelState();
  }

  updatePanelState(): void {
    const { sourcePanel } = this.props;
    const { panelState, filterValueMap, settings } = this.state;
    let { tableSettings } = panelState ?? {};
    if (sourcePanel) {
      // Right now just update the panel state from the source
      // If the source isn't available, just keep the state that's already saved
      if (
        hasInputFilter(sourcePanel.props) &&
        hasPanelState(sourcePanel.state)
      ) {
        const { inputFilters } = sourcePanel.props;
        const { panelState: sourcePanelState } = sourcePanel.state;
        if (sourcePanelState) {
          tableSettings = IrisGridUtils.extractTableSettings(
            sourcePanelState,
            inputFilters
          );
        }
      }
    }

    // eslint-disable-next-line react/no-unused-state
    this.setState({
      panelState: {
        settings,
        tableSettings,
        filterValueMap: Array.from(filterValueMap),
      },
    });
  }

  handleError(): void {
    // Don't want to set an error state, because the user can fix a chart error within the chart itself.
    // We're not loading anymore either so stop showing the spinner so the user can actually click those buttons.
    this.setState({ isLoading: false });
  }

  handleResize(): void {
    this.updateChart();
  }

  handleSettingsChanged(update: Partial<Settings>): void {
    this.setState(({ settings: prevSettings }) => {
      const settings = {
        ...prevSettings,
        ...update,
      };
      log.debug('Updated settings', settings);
      return { settings };
    });
  }

  handleHide(): void {
    this.setActive(false);
  }

  handleShow(): void {
    this.setActive(true);
  }

  handleTabBlur(): void {
    this.setActive(false);
  }

  handleTabFocus(): void {
    const isHidden = this.isHidden();
    this.setActive(!isHidden);
  }

  handleUpdate(): void {
    this.setState({ isLoading: false });
  }

  handleClearAllFilters(): void {
    // nuke link filter and input filter map
    // input filters only clear themselves if they are not yet empty
    this.setState({
      filterValueMap: new Map(),
      filterMap: new Map(),
    });
    this.updatePanelState();
  }

  /**
   * Create an input filter panel for the provided column
   * @param column The column to create the input filter for
   */
  openInputFilter(column: InputFilter): void {
    const { glEventHub } = this.props;
    const { name, type } = column;
    glEventHub.emit(InputFilterEvent.OPEN_INPUT, {
      title: `${name} Filter`,
      panelState: {
        name,
        type,
        isValueShown: true,
      },
      createNewStack: true,
      focusElement: 'input',
    });
  }

  setActive(isActive: boolean): void {
    this.setState({ isActive }, () => {
      if (isActive) {
        this.loadModelIfNecessary();
        this.updateChart();
      }
    });
  }

  sendColumnChange(): void {
    const { model } = this.state;
    if (!model) {
      return;
    }
    const { glEventHub } = this.props;
    glEventHub.emit(
      InputFilterEvent.COLUMNS_CHANGED,
      this,
      Array.from(model.getFilterColumnMap().values())
    );
  }

  getCoordinateForColumn(columnName: ColumnName): [number, number] | null {
    const className = ChartColumnSelectorOverlay.makeButtonClassName(
      columnName
    );

    if (!this.panelContainer.current) {
      return null;
    }

    const element = this.panelContainer.current.querySelector(`.${className}`);
    const rect = element?.getBoundingClientRect() ?? null;
    if (rect == null || rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    const x = rect.left + rect.width / 2;
    const y = rect.bottom;
    return [x, y];
  }

  /**
   * Set chart filters based on the filter map
   * @param filterMapParam Filter map
   */
  setFilterMap(
    filterMapParam: Map<string, { columnType: string; value: string }>
  ): void {
    log.debug('setFilterMap', filterMapParam);
    this.setState(state => {
      const { columnMap, filterMap } = state;
      let updatedFilterMap: null | Map<string, string> = null;
      const filterValueMap = new Map(state.filterValueMap);

      filterMapParam.forEach(({ columnType, value }, columnName) => {
        const column = columnMap.get(columnName);
        if (column == null || column.type !== columnType) {
          return;
        }
        filterValueMap.set(columnName, value);
        if (filterMap.get(columnName) !== value) {
          if (updatedFilterMap === null) {
            updatedFilterMap = new Map(filterMap);
          }
          updatedFilterMap.set(columnName, value);
        }
      });

      // Don't update filterMap unless the filters actually changed.
      // Otherwise the chart gets stuck on a spinner
      // because it never gets an update event for unchanged filters.
      return { filterValueMap, filterMap: updatedFilterMap ?? filterMap };
    });
  }

  unsetFilterValue(columnName: ColumnName): void {
    this.setState(state => {
      // We want to unset a value unless there's an input filter for it
      // If there's an input filter, then we want to just set it to that value
      // This way if the user has an input filter and a link, when they delete the link the input filter value takes effect
      const { inputFilters } = this.props;
      const { columnMap } = state;
      let { filterMap, filterValueMap } = state;
      if (!filterValueMap.has(columnName)) {
        return null;
      }

      filterValueMap = new Map(state.filterValueMap);
      filterValueMap.delete(columnName);

      const inputFilterMap = this.getInputFilterColumnMap(
        columnMap,
        inputFilters
      );

      if (inputFilterMap.has(columnName)) {
        const filterValue = filterMap.get(columnName);
        const inputFilterValue = inputFilterMap.get(columnName)?.value;
        if (inputFilterValue != null && filterValue !== inputFilterValue) {
          filterMap = new Map(state.filterMap);
          if (inputFilterValue.length > 0) {
            filterMap.set(columnName, inputFilterValue);
          } else {
            filterMap.delete(columnName);
          }
        }
      } else {
        filterMap = new Map(state.filterMap);
        filterMap.delete(columnName);
      }
      return { filterMap, filterValueMap };
    });
  }

  updateChangedInputFilters(
    inputFilters: InputFilter[],
    prevInputFilters: InputFilter[]
  ): void {
    const deletedInputFilters = prevInputFilters.filter(
      prevInputFilter =>
        !inputFilters.find(
          inputFilter =>
            inputFilter.name === prevInputFilter.name &&
            inputFilter.type === prevInputFilter.type
        )
    );
    if (deletedInputFilters.length > 0) {
      this.deleteInputFilters(deletedInputFilters);
    }

    const changedInputFilters = inputFilters.filter(
      inputFilter => !prevInputFilters.includes(inputFilter)
    );
    if (changedInputFilters.length > 0) {
      this.updateInputFilters(changedInputFilters);
    }
  }

  updateInputFilters(inputFilters: InputFilter[], forceUpdate = false): void {
    this.setState(state => {
      const { columnMap } = state;
      const filterValueMap = new Map(state.filterValueMap);
      const filterMap = new Map(state.filterMap);
      const update = forceUpdate ? { filterMap, filterValueMap } : {};

      for (let i = 0; i < inputFilters.length; i += 1) {
        const { name, type, value } = inputFilters[i];
        const column = columnMap.get(name);
        if (column != null && column.type === type) {
          if (value != null && filterMap.get(name) !== value) {
            if (value === '') {
              filterMap.delete(name);
            } else {
              filterMap.set(name, value);
            }
            update.filterMap = filterMap;
          }

          if (filterValueMap.has(name)) {
            // Need to unset whatever the linked value was - if they want that value again, they need to double click the link again
            filterValueMap.delete(name);
            update.filterValueMap = filterValueMap;
          }
        }
      }

      log.debug('updateInputFilters', update);
      return update as unknown;
    });
  }

  deleteInputFilters(inputFilters: InputFilter[], forceUpdate = false): void {
    this.setState(state => {
      const { columnMap, filterValueMap } = state;
      const filterMap = new Map(state.filterMap);
      let needsUpdate = forceUpdate;

      for (let i = 0; i < inputFilters.length; i += 1) {
        const { name, type } = inputFilters[i];
        const column = columnMap.get(name);
        if (column != null && column.type === type) {
          if (filterMap.has(name)) {
            const filterValue = filterMap.get(name);
            if (filterValueMap.has(name)) {
              const linkValue = filterValueMap.get(name);
              if (linkValue !== filterValue && linkValue != null) {
                needsUpdate = true;
                filterMap.set(name, linkValue);
              }
            } else {
              needsUpdate = true;
              filterMap.delete(name);
            }
          }
        }
      }

      log.debug('deleteInputFilters', needsUpdate);
      return needsUpdate ? { filterMap } : null;
    });
  }

  updateColumnFilters(): void {
    this.setState(({ model }) => {
      if (!model) {
        return null;
      }

      return { columnMap: model.getFilterColumnMap() };
    });
  }

  updateFilters(): void {
    const { columnMap, filterMap, model } = this.state;
    assertNotNull(model);
    const waitingInputMap = this.getWaitingInputMap(
      model.isFilterRequired(),
      columnMap,
      filterMap
    );
    model.setFilter(filterMap);

    if (filterMap.size > 0 && waitingInputMap.size === 0) {
      const defaultTitle = model.getDefaultTitle();
      const filterTitle = TextUtils.join(
        Array.from(filterMap.entries()).map(
          ([name, value]) => `${name}: ${value}`
        )
      );
      if (defaultTitle) {
        model.setTitle(
          `${defaultTitle}<br><span style="font-size: smaller">${filterTitle}</span>`
        );
      } else {
        model.setTitle(filterTitle);
      }

      log.debug2('updateFilters filters set', filterMap);
      this.setState({ isLoading: true });
    } else {
      log.debug2('updateFilters waiting on inputs', waitingInputMap);
      model.setTitle(model.getDefaultTitle());
      this.setState({ isLoading: false });
    }

    this.updatePanelState();
  }

  /**
   * Removes any set filter values that are no longer part of the model
   */
  pruneFilterMaps(): void {
    this.setState(state => {
      const { columnMap } = state;
      const filterMap = new Map(state.filterMap);
      const filterValueMap = new Map(state.filterValueMap);
      const newState: Pick<
        Partial<ChartPanelState>,
        'filterMap' | 'filterValueMap'
      > = {};

      state.filterValueMap.forEach((value, name) => {
        if (!columnMap.has(name)) {
          filterValueMap.delete(name);
          newState.filterValueMap = filterValueMap;
        }
      });
      state.filterMap.forEach((value, name) => {
        if (!columnMap.has(name)) {
          filterMap.delete(name);
          newState.filterMap = filterMap;
        }
      });
      return newState as unknown;
    });
  }

  updateChart(): void {
    if (this.chart.current) {
      this.chart.current.updateDimensions();
    }
  }

  render(): ReactElement {
    const {
      columnSelectionValidator,
      glContainer,
      glEventHub,
      inputFilters,
      isLinkerActive,
      links,
      metadata,
      settings,
    } = this.props;
    const {
      columnMap,
      filterMap,
      error,
      model,
      isActive,
      isDisconnected,
      isLoaded,
      isLoading,
    } = this.state;
    const { figure: figureName, table: tableName } = metadata;
    const inputFilterMap = this.getInputFilterColumnMap(
      columnMap,
      inputFilters
    );
    const linkedColumnMap = this.getLinkedColumnMap(columnMap, links);
    const waitingInputMap =
      model != null
        ? this.getWaitingInputMap(
            model.isFilterRequired(),
            columnMap,
            filterMap
          )
        : new Map();
    const waitingFilterMap =
      model != null
        ? this.getWaitingFilterMap(
            model.isFilterRequired(),
            columnMap,
            filterMap,
            linkedColumnMap,
            inputFilterMap
          )
        : new Map();
    const errorMessage = error ? `Unable to open chart. ${error}` : undefined;
    const isWaitingForFilter = waitingInputMap.size > 0;
    const isSelectingColumn = columnMap.size > 0 && isLinkerActive;
    return (
      <WidgetPanel
        className={classNames('iris-chart-panel', {
          'input-required': isWaitingForFilter,
        })}
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onHide={this.handleHide}
        onClearAllFilters={this.handleClearAllFilters}
        onResize={this.handleResize}
        onShow={this.handleShow}
        onTabBlur={this.handleTabBlur}
        onTabFocus={this.handleTabFocus}
        errorMessage={errorMessage}
        isDisconnected={isDisconnected}
        isLoading={isLoading}
        isLoaded={isLoaded}
        widgetName={figureName || tableName}
        widgetType="Chart"
      >
        <div
          ref={this.panelContainer}
          className="chart-panel-container h-100 w-100"
        >
          <div className="chart-container h-100 w-100">
            {isLoaded && model && (
              <Chart
                isActive={isActive}
                model={model}
                settings={settings}
                ref={this.chart}
                onDisconnect={this.handleDisconnect}
                onReconnect={this.handleReconnect}
                onUpdate={this.handleUpdate}
                onError={this.handleError}
                onSettingsChanged={this.handleSettingsChanged}
              />
            )}
          </div>
          <CSSTransition
            in={isWaitingForFilter && !isSelectingColumn && !isLoading}
            timeout={ThemeExport.transitionMs}
            classNames="fade"
            mountOnEnter
            unmountOnExit
          >
            <ChartFilterOverlay
              inputFilterMap={inputFilterMap}
              linkedColumnMap={linkedColumnMap}
              onAdd={this.handleFilterAdd}
              onOpenLinker={this.handleOpenLinker}
              columnMap={columnMap}
              waitingFilterMap={waitingFilterMap}
              waitingInputMap={waitingInputMap}
            />
          </CSSTransition>
          <CSSTransition
            in={isSelectingColumn}
            timeout={ThemeExport.transitionMs}
            classNames="fade"
            mountOnEnter
            unmountOnExit
          >
            <ChartColumnSelectorOverlay
              columns={this.getSelectorColumns(
                columnMap,
                linkedColumnMap,
                columnSelectionValidator
              )}
              onColumnSelected={this.handleColumnSelected}
              onMouseEnter={this.handleColumnMouseEnter}
              onMouseLeave={this.handleColumnMouseLeave}
            />
          </CSSTransition>
        </div>
      </WidgetPanel>
    );
  }
}

const mapStateToProps = (
  state: RootState,
  ownProps: { localDashboardId: string; metadata: { sourcePanelId: string } }
) => {
  const { localDashboardId, metadata } = ownProps;

  let sourcePanelId;
  if (metadata) {
    sourcePanelId = metadata.sourcePanelId;
  }
  const panelTableMap = getTableMapForDashboard(state, localDashboardId);
  const openedPanelMap = getOpenedPanelMapForDashboard(state, localDashboardId);
  const activeTool = getActiveTool(state);
  const isolatedLinkerPanelId = getIsolatedLinkerPanelIdForDashboard(
    state,
    localDashboardId
  );
  const isLinkerActive =
    activeTool === ToolType.LINKER && isolatedLinkerPanelId === undefined;
  return {
    columnSelectionValidator: getColumnSelectionValidatorForDashboard(
      state,
      localDashboardId
    ),
    isLinkerActive,
    inputFilters: getInputFiltersForDashboard(state, localDashboardId),
    links: getLinksForDashboard(state, localDashboardId),
    source:
      sourcePanelId != null ? panelTableMap.get(sourcePanelId) : undefined,
    sourcePanel:
      sourcePanelId != null ? openedPanelMap.get(sourcePanelId) : undefined,
    settings: getSettings(state),
  };
};

export default connect(
  mapStateToProps,
  {
    setActiveTool: setActiveToolAction,
    setDashboardIsolatedLinkerPanelId: setDashboardIsolatedLinkerPanelIdAction,
  },
  null,
  { forwardRef: true }
)(ChartPanel);
