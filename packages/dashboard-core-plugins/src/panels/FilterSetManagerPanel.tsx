import React, { Component, ReactElement } from 'react';
import { connect } from 'react-redux';
import {
  getOpenedPanelMapForDashboard,
  LayoutUtils,
  PanelComponent,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import type { Container, EventEmitter } from '@deephaven/golden-layout';
import type { TableTemplate } from '@deephaven/jsapi-types';
import { RootState } from '@deephaven/redux';
import {
  AdvancedFilter,
  ColumnName,
  DehydratedIrisGridState,
  QuickFilter,
} from '@deephaven/iris-grid';
import { GridState } from '@deephaven/grid';
import {
  getFilterSetsForDashboard,
  getInputFiltersForDashboard,
  getTableMapForDashboard,
  setDashboardFilterSets as setDashboardFilterSetsAction,
} from '../redux';
import Panel from './Panel';
import FilterSetManager, {
  ChangeHandlerArgs,
  FilterSet,
  FilterSetPanel,
} from './FilterSetManager';
import { IrisGridPanel } from './IrisGridPanel';
import DropdownFilterPanel from './DropdownFilterPanel';
import InputFilterPanel, {
  PanelState as InputFilterPanelState,
} from './InputFilterPanel';
import './FilterSetManagerPanel.scss';

const log = Log.module('FilterSetManagerPanel');
interface IrisGridState {
  advancedFilters: [number, AdvancedFilter][];
  quickFilters: [number, QuickFilter][];
}

interface PanelState {
  irisGridState?: IrisGridState;
  gridState?: Partial<GridState>;
  selectedId?: string | string[];
  isValueShown?: boolean;
  name?: string;
  type?: string;
  value?: string;
}

interface FilterSetManagerPanelProps {
  glContainer: Container;
  glEventHub: EventEmitter;
  panelState: PanelState;
  filterSets: FilterSet[];
  localDashboardId: string;
  dashboardOpenedPanelMap: Map<string | string[], PanelComponent>;
  setDashboardFilterSets: (
    dashboardId: string,
    filterSets: FilterSet[]
  ) => void;
  panelTableMap: Map<string | string[], TableTemplate>;
}

interface FilterSetManagerPanelState {
  selectedId?: string | string[];
  isValueShown: boolean;
  // eslint-disable-next-line react/no-unused-state
  panelState: PanelState; // Dehydrated panel state that can load this panel
}

function hasSetPanelState(panel: PanelComponent): panel is PanelComponent & {
  setPanelState: (state: InputFilterPanelState) => void;
} {
  return (
    (
      panel as PanelComponent & {
        setPanelState: (state: InputFilterPanelState) => void;
      }
    ).setPanelState != null
  );
}
export class FilterSetManagerPanel extends Component<
  FilterSetManagerPanelProps,
  FilterSetManagerPanelState
> {
  static defaultProps = {
    panelState: null,
  };

  static COMPONENT = 'FilterSetManagerPanel';

  static changeFilterIndexesToColumnNames<T>(
    table: TableTemplate,
    configs: [number, T][]
  ): { name: string; filter: T }[] {
    return configs
      .map(([index, filter]) => {
        if (index >= table.columns.length) {
          return null;
        }
        const { name } = table.columns[index];
        return { name, filter };
      })
      .filter(config => config != null) as { name: string; filter: T }[];
  }

  constructor(props: FilterSetManagerPanelProps) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleFilterApply = this.handleFilterApply.bind(this);
    this.handleSetsUpdate = this.handleSetsUpdate.bind(this);
    this.handleGetFilterState = this.handleGetFilterState.bind(this);

    const { panelState, filterSets } = props;
    const {
      selectedId = filterSets.length > 0 ? filterSets[0].id : undefined,
      isValueShown = false,
    } = panelState ?? {};

    this.state = {
      selectedId,
      isValueShown,
      // eslint-disable-next-line react/no-unused-state
      panelState, // Dehydrated panel state that can load this panel
    };
  }

  // Collect all filter values for each dashboard panel
  getFilterState(): FilterSetPanel[] {
    const { dashboardOpenedPanelMap } = this.props;
    const panels: FilterSetPanel[] = [];
    [...dashboardOpenedPanelMap.keys()].forEach(key => {
      const panel = dashboardOpenedPanelMap.get(key);

      if (panel === undefined) {
        log.error('Could not get panel', panel);
        return;
      }

      const componentName = LayoutUtils.getComponentNameFromPanel(panel);
      const panelId = LayoutUtils.getIdFromPanel(panel);
      log.debug('Panel:', panel, componentName);

      const { glContainer = null } = panel.props;
      if (glContainer == null) {
        log.error('Could not get panel container', panel);
        return;
      }
      const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
      if (config == null) {
        log.error('Could not get component config from container', glContainer);
        return;
      }
      const panelState = LayoutUtils.getPanelComponentState(
        config
      ) as PanelState;
      if (panelState == null) {
        log.debug(`Panel state is null ${panelId}`);
        return;
      }
      switch (componentName) {
        case LayoutUtils.getComponentName(IrisGridPanel): {
          let state;
          if (panelId != null) {
            state = this.getIrisGridPanelFilters(panelId, panelState);
          }
          if (state != null) {
            panels.push({
              panelId,
              type: componentName,
              state,
            });
          }
          break;
        }
        case LayoutUtils.getComponentName(InputFilterPanel):
        case LayoutUtils.getComponentName(DropdownFilterPanel): {
          const { isValueShown, name, type, value } = panelState;
          panels.push({
            panelId,
            type: componentName,
            state: { isValueShown, name, type, value },
          });
          break;
        }
        default:
      }
    });
    return panels;
  }

  getIrisGridPanelFilters(
    panelId: string | string[],
    panelState: PanelState
  ): {
    irisGridState: Omit<IrisGridState, 'advancedFilters' | 'quickFilters'> & {
      advancedFilters?: {
        name: string;
        filter: AdvancedFilter;
      }[];
      quickFilters?: {
        name: string;
        filter: QuickFilter;
      }[];
    };
    gridState: Partial<GridState>;
  } | null {
    const { panelTableMap } = this.props;
    const table = panelTableMap.get(panelId);
    if (table == null) {
      log.error(`Unable to get table for panel ${panelId}.`);
      return null;
    }
    // IrisGridUtils.hydrate uses numeric indexes for columns
    // Change indexes to column names to make it work for proxy models
    const {
      irisGridState = { advancedFilters: undefined, quickFilters: undefined },
      gridState = {},
    } = panelState;
    const {
      advancedFilters: indexedAdvancedFilters,
      quickFilters: indexedQuickFilters,
    } = irisGridState;
    let advancedFilters;
    if (indexedAdvancedFilters) {
      advancedFilters = FilterSetManagerPanel.changeFilterIndexesToColumnNames(
        table,
        indexedAdvancedFilters
      );
    }

    let quickFilters;
    if (indexedQuickFilters) {
      quickFilters = FilterSetManagerPanel.changeFilterIndexesToColumnNames(
        table,
        indexedQuickFilters
      );
    }
    return {
      irisGridState: {
        ...irisGridState,
        advancedFilters,
        quickFilters,
      },
      gridState: { ...gridState },
    };
  }

  handleGetFilterState(): FilterSetPanel[] {
    return this.getFilterState();
  }

  handleChange({ isValueShown, selectedId }: ChangeHandlerArgs): void {
    log.debug('handleChange', isValueShown, selectedId);
    this.setState({ isValueShown, selectedId });
    this.updatePanelState();
  }

  handleFilterApply(filterSet: FilterSet): void {
    const { dashboardOpenedPanelMap } = this.props;
    const { panels, restoreFullState = false } = filterSet;
    log.debug(`Apply filters from filter set`, filterSet);
    panels.forEach(({ panelId, type, state }) => {
      if (panelId == null) {
        log.debug('panel is null', panelId);
        return;
      }
      if (!dashboardOpenedPanelMap.has(panelId)) {
        log.debug('Ignore closed panel', panelId);
        return;
      }
      log.debug('Apply panel filters', panelId, type, state);
      const panel = dashboardOpenedPanelMap.get(panelId);
      switch (type) {
        case LayoutUtils.getComponentName(IrisGridPanel):
          this.restoreIrisGridFilters(
            panel as IrisGridPanel,
            state as {
              irisGridState: Partial<DehydratedIrisGridState>;
              gridState: Partial<GridState>;
              advancedFilters: { name: string; filter: AdvancedFilter }[];
              quickFilters: { name: string; filter: QuickFilter }[];
            },
            restoreFullState
          );
          break;
        case LayoutUtils.getComponentName(InputFilterPanel):
        case LayoutUtils.getComponentName(DropdownFilterPanel):
          this.restoreInputFilterState(panel, state as InputFilterPanelState);
          break;
        default:
      }
    });
  }

  handleSetsUpdate(modifiedFilterSets: FilterSet[]): void {
    const { setDashboardFilterSets, localDashboardId } = this.props;
    log.debug('Saving updated sets', modifiedFilterSets);
    // Filter sets are stored in dashboard data instead of the panelState
    // because they need to be shared between the filter view manager panels
    setDashboardFilterSets(localDashboardId, [...modifiedFilterSets]);
  }

  updatePanelState(): void {
    this.setState(({ selectedId, isValueShown }) => ({
      // eslint-disable-next-line react/no-unused-state
      panelState: {
        selectedId,
        isValueShown,
      },
    }));
  }

  restoreIrisGridFilters(
    panel: IrisGridPanel,
    state: {
      irisGridState: Partial<DehydratedIrisGridState>;
      gridState: Partial<GridState>;
      advancedFilters: { name: ColumnName; filter: AdvancedFilter }[];
      quickFilters: { name: ColumnName; filter: QuickFilter }[];
    },
    restoreFullState: boolean
  ): void {
    // Fall back to state.advancedFilters and state.quickFilters
    // for backward compatibility with filter sets that only contain filters
    const {
      irisGridState = {},
      advancedFilters: prevAdvancedFilters = [],
      quickFilters: prevQuickFilters = [],
    } = state;
    const {
      advancedFilters = prevAdvancedFilters,
      quickFilters = prevQuickFilters,
    } = irisGridState;
    const { panelTableMap } = this.props;
    const panelId = LayoutUtils.getIdFromPanel(panel);
    if (panelId == null) {
      log.error(`Panel Id is null.`);
      return;
    }
    const table = panelTableMap.get(panelId);
    if (table == null) {
      log.error(`Unable to get table for panel ${panelId}.`);
      return;
    }
    log.debug('restoreIrisGridFilters', panelId, state, restoreFullState);
    if (restoreFullState) {
      panel.setStateOverrides(state);
    } else {
      panel.setFilters({
        quickFilters: quickFilters as {
          name: string;
          filter: QuickFilter;
        }[],
        advancedFilters: advancedFilters as {
          name: string;
          filter: AdvancedFilter;
        }[],
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  restoreInputFilterState(
    panel: PanelComponent | undefined,
    state: InputFilterPanelState
  ): void {
    const inputFilterState = { ...state };
    // Restore state but don't flip the card
    delete inputFilterState.isValueShown;
    log.debug('restoreInputFilterState', panel, inputFilterState);
    if (panel && hasSetPanelState(panel)) {
      panel.setPanelState(inputFilterState);
    }
  }

  render(): ReactElement {
    const { glContainer, glEventHub, filterSets } = this.props;
    const { isValueShown, selectedId } = this.state;
    return (
      <Panel
        className="filter-set-manager-panel"
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        isClonable
        isRenamable
      >
        <div className="input-filter-container h-100 w-100 container">
          <FilterSetManager
            onChange={this.handleChange}
            onApply={this.handleFilterApply}
            onUpdateSets={this.handleSetsUpdate}
            isValueShown={isValueShown}
            filterSets={filterSets}
            selectedId={selectedId as string}
            getFilterState={this.handleGetFilterState}
          />
        </div>
      </Panel>
    );
  }
}

const mapStateToProps = (
  state: RootState,
  ownProps: { localDashboardId: string }
) => {
  const { localDashboardId } = ownProps;
  return {
    filterSets: getFilterSetsForDashboard(state, localDashboardId),
    dashboardOpenedPanelMap: getOpenedPanelMapForDashboard(
      state,
      localDashboardId
    ),
    dashboardInputFilters: getInputFiltersForDashboard(state, localDashboardId),
    panelTableMap: getTableMapForDashboard(state, localDashboardId),
  };
};

const ConnectedFilterSetManagerPanel = connect(
  mapStateToProps,
  {
    setDashboardFilterSets: setDashboardFilterSetsAction,
  },
  null,
  { forwardRef: true }
)(FilterSetManagerPanel);

export default ConnectedFilterSetManagerPanel;
