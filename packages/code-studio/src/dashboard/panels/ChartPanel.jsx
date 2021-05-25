import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import memoize from 'memoize-one';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';
import debounce from 'lodash.debounce';
import { Chart, ChartUtils } from '@deephaven/chart';
import { IrisGridUtils } from '@deephaven/iris-grid';
import dh from '@deephaven/jsapi-shim';
import { ThemeExport } from '@deephaven/components';
import Log from '@deephaven/log';
import {
  getActiveTool,
  getColumnSelectionValidatorForDashboard,
  getInputFiltersForDashboard,
  getIsolatedLinkerPanelIdForDashboard,
  getLinksForDashboard,
  getOpenedPanelMapForDashboard,
  getTableMapForDashboard,
  setActiveTool as setActiveToolAction,
  setDashboardIsolatedLinkerPanelId as setDashboardIsolatedLinkerPanelIdAction,
} from '@deephaven/redux';
import { Pending, PromiseUtils, TextUtils } from '@deephaven/utils';
import WidgetPanel from './WidgetPanel';
import ToolType from '../../tools/ToolType';
import {
  GLPropTypes,
  IrisPropTypes,
  UIPropTypes,
} from '../../include/prop-types';
import { ControlEvent, InputFilterEvent, ChartEvent } from '../events';
import ChartFilterOverlay from './ChartFilterOverlay';
import ChartColumnSelectorOverlay from './ChartColumnSelectorOverlay';
import ControlType from '../../controls/ControlType';
import './ChartPanel.scss';
import LayoutUtils from '../../layout/LayoutUtils';

const log = Log.module('ChartPanel');
const UPDATE_MODEL_DEBOUNCE = 150;

export class ChartPanel extends Component {
  static COMPONENT = 'ChartPanel';

  constructor(props) {
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
    const queryName = metadata.query;

    this.state = {
      settings,
      error: null,
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
      model: null,
      columnMap: new Map(),

      queryName,

      // eslint-disable-next-line react/no-unused-state
      panelState,
    };
  }

  componentDidMount() {
    if (!this.isHidden()) {
      this.setState({ isActive: true });
      this.initModel();
    }
  }

  componentDidUpdate(prevProps, prevState) {
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

    if (settings !== prevState.settings) {
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

  componentWillUnmount() {
    this.pending.cancel();

    const { source } = this.props;
    if (source) {
      this.stopListeningToSource(source);
    }
  }

  initModel() {
    this.setState({ isLoading: true, isLoaded: false, error: null });

    const { makeModel } = this.props;
    this.pending
      .add(makeModel(), resolved => {
        resolved.close();
      })
      .then(this.handleLoadSuccess, this.handleLoadError);
  }

  getWaitingInputMap = memoize((isFilterRequired, columnMap, filterMap) => {
    if (!isFilterRequired) {
      return new Map();
    }
    const waitingInputMap = new Map(columnMap);
    filterMap.forEach((filter, name) => {
      waitingInputMap.delete(name);
    });
    return waitingInputMap;
  });

  getWaitingFilterMap = memoize(
    (
      isFilterRequired,
      columnMap,
      filterMap,
      linkedColumnMap,
      inputFilterMap
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

  getInputFilterColumnMap = memoize((columnMap, inputFilters) => {
    const inputFilterMap = new Map();
    for (let i = 0; i < inputFilters.length; i += 1) {
      const inputFilter = inputFilters[i];
      const { name, type } = inputFilter;
      const column = columnMap.get(name);
      if (column != null && column.type === type) {
        inputFilterMap.set(name, inputFilter);
      }
    }
    return inputFilterMap;
  });

  getLinkedColumnMap = memoize((columnMap, links) => {
    const linkedColumnMap = new Map();
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
        linkedColumnMap.set(columnName, columnMap.get(columnName));
      }
    }
    return linkedColumnMap;
  });

  getSelectorColumns = memoize(
    (columnMap, linkedColumnMap, columnSelectionValidator) =>
      [...columnMap.values()].map(column => ({
        name: column.name,
        type: column.type,
        isValid: columnSelectionValidator
          ? columnSelectionValidator(this, column)
          : false,
        isActive: linkedColumnMap.has(column.name),
      }))
  );

  startListeningToSource(table) {
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

  stopListeningToSource(table) {
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

  loadModelIfNecessary() {
    const { isActive, isLoaded, isLoading } = this.state;
    if (isActive && !isLoaded && !isLoading) {
      this.initModel();
    }
  }

  isHidden() {
    const { glContainer } = this.props;
    const { isHidden } = glContainer;
    return isHidden;
  }

  handleColumnSelected(columnName) {
    const { glEventHub } = this.props;
    const { columnMap } = this.state;
    glEventHub.emit(
      ChartEvent.COLUMN_SELECTED,
      this,
      columnMap.get(columnName)
    );
  }

  handleColumnMouseEnter({ type, name }) {
    const { columnSelectionValidator } = this.props;
    log.debug('handleColumnMouseEnter', columnSelectionValidator, type, name);
    if (!columnSelectionValidator) {
      return;
    }
    columnSelectionValidator(this, { type, name });
  }

  handleColumnMouseLeave() {
    const { columnSelectionValidator } = this.props;
    log.debug('handleColumnMouseLeave', columnSelectionValidator);
    if (!columnSelectionValidator) {
      return;
    }
    columnSelectionValidator(this, null);
  }

  handleDisconnect() {
    this.setState({
      error: new Error('Figure disconnected'),
      isDisconnected: true,
    });
  }

  handleFilterAdd(columns) {
    for (let i = 0; i < columns.length; i += 1) {
      this.openInputFilter(columns[i]);
    }
  }

  handleOpenLinker() {
    const {
      localDashboardId,
      setActiveTool,
      setDashboardIsolatedLinkerPanelId,
    } = this.props;
    setDashboardIsolatedLinkerPanelId(localDashboardId, null);
    setActiveTool(ToolType.LINKER);
  }

  handleReconnect() {
    this.setState({ isDisconnected: false, error: null });
    this.sendColumnChange();
    this.updateColumnFilters();
  }

  handleLoadSuccess(model) {
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

  handleLoadError(error) {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }

    log.error('handleLoadError', error);
    this.setState({ error, isLoading: false });
  }

  handleSourceColumnChange() {
    this.updateModelFromSource();
  }

  handleSourceFilterChange() {
    this.updateModelFromSource();
  }

  handleSourceSortChange() {
    this.updateModelFromSource();
  }

  updateModelFromSource() {
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
        dh.plot.Figure.create(ChartUtils.makeFigureSettings(settings, source))
      )
      .then(figure => {
        model.setFigure(figure);
      })
      .catch(this.handleLoadError);

    this.updatePanelState();
  }

  updatePanelState() {
    const { sourcePanel } = this.props;
    const { panelState, filterValueMap, settings } = this.state;
    let { tableSettings } = panelState ?? {};
    if (sourcePanel) {
      // Right now just update the panel state from the source
      // If the source isn't available, just keep the state that's already saved
      const { inputFilters } = sourcePanel.props;
      const { panelState: sourcePanelState } = sourcePanel.state;
      if (sourcePanelState) {
        tableSettings = IrisGridUtils.extractTableSettings(
          sourcePanelState,
          inputFilters
        );
      }
    }

    // eslint-disable-next-line react/no-unused-state
    this.setState({
      panelState: {
        settings,
        tableSettings,
        filterValueMap: [...filterValueMap],
      },
    });
  }

  handleError() {
    // Don't want to set an error state, because the user can fix a chart error within the chart itself.
    // We're not loading anymore either so stop showing the spinner so the user can actually click those buttons.
    this.setState({ isLoading: false });
  }

  handleResize() {
    this.updateChart();
  }

  handleSettingsChanged(update) {
    this.setState(({ settings: prevSettings }) => {
      const settings = {
        ...prevSettings,
        ...update,
      };
      log.debug('Updated settings', settings);
      return { settings };
    });
  }

  handleHide() {
    this.setActive(false);
  }

  handleShow() {
    this.setActive(true);
  }

  handleTabBlur() {
    this.setActive(false);
  }

  handleTabFocus() {
    const isHidden = this.isHidden();
    this.setActive(!isHidden);
  }

  handleUpdate() {
    this.setState({ isLoading: false });
  }

  handleClearAllFilters() {
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
   * @param {dh.Column} column The column to create the input filter for
   */
  openInputFilter(column) {
    const { glEventHub } = this.props;
    const { name, type } = column;
    glEventHub.emit(ControlEvent.OPEN, {
      title: `${name} Filter`,
      type: ControlType.INPUT_FILTER,
      panelState: {
        name,
        type,
        isValueShown: true,
      },
      createNewStack: true,
      focusElement: 'input',
    });
  }

  setActive(isActive) {
    this.setState({ isActive }, () => {
      if (isActive) {
        this.loadModelIfNecessary();
        this.updateChart();
      }
    });
  }

  sendColumnChange() {
    const { model } = this.state;
    if (!model) {
      return;
    }
    const { glEventHub } = this.props;
    glEventHub.emit(InputFilterEvent.COLUMNS_CHANGED, this, [
      ...model.getFilterColumnMap().values(),
    ]);
  }

  getCoordinateForColumn(columnName) {
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
   * @param {Map<string, Object>} filterMapParam Filter map
   */
  setFilterMap(filterMapParam) {
    log.debug('setFilterMap', filterMapParam);
    this.setState(state => {
      const { columnMap, filterMap } = state;
      let updatedFilterMap = null;
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

  unsetFilterValue(columnName) {
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
        const inputFilterValue = inputFilterMap.get(columnName).value;
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

  updateChangedInputFilters(inputFilters, prevInputFilters) {
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

  updateInputFilters(inputFilters, forceUpdate = false) {
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
      return update;
    });
  }

  deleteInputFilters(inputFilters, forceUpdate = false) {
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
              if (linkValue !== filterValue) {
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

  updateColumnFilters() {
    this.setState(({ model }) => {
      if (!model) {
        return null;
      }

      return { columnMap: model.getFilterColumnMap() };
    });
  }

  updateFilters() {
    const { columnMap, filterMap, model } = this.state;
    const waitingInputMap = this.getWaitingInputMap(
      model.isFilterRequired(),
      columnMap,
      filterMap
    );
    model.setFilter(filterMap);

    if (filterMap.size > 0 && waitingInputMap.size === 0) {
      const defaultTitle = model.getDefaultTitle();
      const filterTitle = TextUtils.join(
        [...filterMap.entries()].map(([name, value]) => `${name}: ${value}`)
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
  pruneFilterMaps() {
    this.setState(state => {
      const { columnMap } = state;
      const filterMap = new Map(state.filterMap);
      const filterValueMap = new Map(state.filterValueMap);
      const newState = {};

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

      return newState;
    });
  }

  updateChart() {
    if (this.chart.current) {
      this.chart.current.updateDimensions();
    }
  }

  render() {
    const {
      columnSelectionValidator,
      glContainer,
      glEventHub,
      inputFilters,
      isLinkerActive,
      links,
      metadata,
    } = this.props;
    const {
      columnMap,
      filterMap,
      error,
      model,
      queryName,
      isActive,
      isDisconnected,
      isLoaded,
      isLoading,
    } = this.state;
    const { figure: figureName, querySerial, table: tableName } = metadata;
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
    const errorMessage = error ? `Unable to open chart. ${error}` : null;
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
        queryName={queryName}
        querySerial={querySerial}
        widgetName={figureName || tableName}
        widgetType="Chart"
      >
        <div
          ref={this.panelContainer}
          className="chart-panel-container h-100 w-100"
        >
          <div className="chart-container h-100 w-100">
            {isLoaded && (
              <Chart
                isActive={isActive}
                model={model}
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

ChartPanel.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,

  metadata: PropTypes.shape({
    figure: PropTypes.string,
    table: PropTypes.string,
    query: PropTypes.string,
    querySerial: PropTypes.string,
    sourcePanelId: PropTypes.string,
    settings: PropTypes.shape({
      isLinked: PropTypes.bool,
    }),
  }).isRequired,
  /** Function to build the ChartModel used by this ChartPanel. Can return a promise. */
  makeModel: PropTypes.func.isRequired,
  inputFilters: PropTypes.arrayOf(UIPropTypes.InputFilter).isRequired,
  links: UIPropTypes.Links.isRequired,
  localDashboardId: PropTypes.string.isRequired,
  isLinkerActive: PropTypes.bool,
  source: IrisPropTypes.Table,
  sourcePanel: UIPropTypes.Panel,
  columnSelectionValidator: PropTypes.func,
  setActiveTool: PropTypes.func.isRequired,
  setDashboardIsolatedLinkerPanelId: PropTypes.func.isRequired,

  panelState: PropTypes.shape({}),
};

ChartPanel.defaultProps = {
  columnSelectionValidator: null,
  isLinkerActive: false,
  source: null,
  sourcePanel: null,
  panelState: null,
};

ChartPanel.displayName = 'ChartPanel';

const mapStateToProps = (state, ownProps) => {
  const { localDashboardId, metadata = {} } = ownProps;
  const { sourcePanelId } = metadata;
  const panelTableMap = getTableMapForDashboard(state, localDashboardId);
  const openedPanelMap = getOpenedPanelMapForDashboard(state, localDashboardId);
  const activeTool = getActiveTool(state);
  const isolatedLinkerPanelId = getIsolatedLinkerPanelIdForDashboard(
    state,
    localDashboardId
  );
  const isLinkerActive =
    activeTool === ToolType.LINKER && isolatedLinkerPanelId === null;
  return {
    columnSelectionValidator: getColumnSelectionValidatorForDashboard(
      state,
      localDashboardId
    ),
    isLinkerActive,
    inputFilters: getInputFiltersForDashboard(state, localDashboardId),
    links: getLinksForDashboard(state, localDashboardId),
    source: panelTableMap.get(sourcePanelId),
    sourcePanel: openedPanelMap.get(sourcePanelId),
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
