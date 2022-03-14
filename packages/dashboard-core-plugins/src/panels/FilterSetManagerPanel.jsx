import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  getOpenedPanelMapForDashboard,
  GLPropTypes,
  LayoutUtils,
} from '@deephaven/dashboard';
import { IrisGridUtils } from '@deephaven/iris-grid';
import Log from '@deephaven/log';
import {
  getFilterSetsForDashboard,
  getInputFiltersForDashboard,
  getTableMapForDashboard,
  setDashboardFilterSets as setDashboardFilterSetsAction,
} from '../redux';
import Panel from './Panel';
import FilterSetManager from './FilterSetManager';
import IrisGridPanel from './IrisGridPanel';
import InputFilterPanel from './InputFilterPanel';
import DropdownFilterPanel from './DropdownFilterPanel';

import './FilterSetManagerPanel.scss';

const log = Log.module('FilterSetManagerPanel');

class FilterSetManagerPanel extends Component {
  static COMPONENT = 'FilterSetManagerPanel';

  static changeFilterColumnNamesToIndexes(table, configs) {
    return configs
      .map(({ name, filter }) => {
        const index = table.columns.findIndex(column => column.name === name);
        return index < 0 ? null : [index, filter];
      })
      .filter(config => config != null);
  }

  static changeFilterIndexesToColumnNames(table, configs) {
    return configs
      .map(([index, filter]) => {
        if (index >= table.columns.length) {
          return null;
        }
        const { name } = table.columns[index];
        return { name, filter };
      })
      .filter(config => config != null);
  }

  constructor(props) {
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
  getFilterState() {
    const { dashboardOpenedPanelMap } = this.props;
    const panels = [];
    [...dashboardOpenedPanelMap.keys()].forEach(key => {
      const panel = dashboardOpenedPanelMap.get(key);
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
      const panelState = LayoutUtils.getPanelComponentState(config);
      if (panelState == null) {
        log.debug(`Panel state is null ${panelId}`);
        return;
      }
      switch (componentName) {
        case LayoutUtils.getComponentName(IrisGridPanel): {
          const state = this.getIrisGridPanelFilters(panelId, panelState);
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

  getIrisGridPanelFilters(panelId, panelState) {
    const { panelTableMap } = this.props;
    const table = panelTableMap.get(panelId);
    if (table == null) {
      log.error(`Unable to get table for panel ${panelId}.`);
      return null;
    }
    // IrisGridUtils.hydrate uses numeric indexes for columns
    // Change indexes to column names to make it work for proxy models
    const { irisGridState = null } = panelState;
    const {
      advancedFilters: indexedAdvancedFilters = [],
      quickFilters: indexedQuickFilters = [],
    } = irisGridState ?? {};
    const dehydratedAdvancedFilters = IrisGridUtils.dehydrateAdvancedFilters(
      table.columns,
      indexedAdvancedFilters
    );
    const advancedFilters = FilterSetManagerPanel.changeFilterIndexesToColumnNames(
      table,
      dehydratedAdvancedFilters
    );
    const dehydratedQuickFilters = IrisGridUtils.dehydrateQuickFilters(
      indexedQuickFilters
    );
    const quickFilters = FilterSetManagerPanel.changeFilterIndexesToColumnNames(
      table,
      dehydratedQuickFilters
    );
    return { advancedFilters, quickFilters };
  }

  handleGetFilterState() {
    return this.getFilterState();
  }

  handleChange({ isValueShown, selectedId }) {
    log.debug('handleChange', isValueShown, selectedId);
    this.setState({ isValueShown, selectedId });
    this.updatePanelState();
  }

  handleFilterApply(filterSet) {
    const { dashboardOpenedPanelMap } = this.props;
    const { panels } = filterSet;
    log.debug(`Apply filters from filter set`, filterSet);
    panels.forEach(({ panelId, type, state }) => {
      if (!dashboardOpenedPanelMap.has(panelId)) {
        log.debug('Ignore closed panel', panelId);
        return;
      }
      log.debug('Apply panel filters', panelId, type, state);
      const panel = dashboardOpenedPanelMap.get(panelId);
      switch (type) {
        case LayoutUtils.getComponentName(IrisGridPanel):
          this.restoreIrisGridFilters(panel, state);
          break;
        case LayoutUtils.getComponentName(InputFilterPanel):
        case LayoutUtils.getComponentName(DropdownFilterPanel):
          this.restoreInputFilterState(panel, state);
          break;
        default:
      }
    });
  }

  handleSetsUpdate(modifiedFilterSets) {
    const { setDashboardFilterSets, localDashboardId } = this.props;
    log.debug('Saving updated sets', modifiedFilterSets);
    // Filter sets are stored in dashboard data instead of the panelState
    // because they need to be shared between the filter view manager panels
    setDashboardFilterSets(localDashboardId, [...modifiedFilterSets]);
  }

  updatePanelState() {
    this.setState(({ selectedId, isValueShown }) => ({
      // eslint-disable-next-line react/no-unused-state
      panelState: {
        selectedId,
        isValueShown,
      },
    }));
  }

  restoreIrisGridFilters(panel, state) {
    const {
      advancedFilters: savedAdvancedFilters,
      quickFilters: savedQuickFilters,
    } = state;
    const { panelTableMap } = this.props;
    const panelId = LayoutUtils.getIdFromPanel(panel);
    const table = panelTableMap.get(panelId);
    if (table == null) {
      log.error(`Unable to get table for panel ${panelId}.`);
      return;
    }
    log.debug('restoreIrisGridFilters', panelId, state);
    const quickFilters = FilterSetManagerPanel.changeFilterColumnNamesToIndexes(
      table,
      savedQuickFilters
    );
    const advancedFilters = FilterSetManagerPanel.changeFilterColumnNamesToIndexes(
      table,
      savedAdvancedFilters
    );
    panel.setFilters({ quickFilters, advancedFilters });
  }

  // eslint-disable-next-line class-methods-use-this
  restoreInputFilterState(panel, state) {
    const inputFilterState = { ...state };
    // Restore state but don't flip the card
    delete inputFilterState.isValueShown;
    log.debug('restoreInputFilterState', panel, inputFilterState);
    panel.setPanelState(inputFilterState);
  }

  render() {
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
            selectedId={selectedId}
            getFilterState={this.handleGetFilterState}
          />
        </div>
      </Panel>
    );
  }
}

FilterSetManagerPanel.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  panelState: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    selectedId: PropTypes.string,
    isValueShown: PropTypes.bool,
  }),
  filterSets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      panels: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    })
  ).isRequired,
  localDashboardId: PropTypes.string.isRequired,
  dashboardOpenedPanelMap: PropTypes.instanceOf(Map).isRequired,
  setDashboardFilterSets: PropTypes.func.isRequired,
  panelTableMap: PropTypes.instanceOf(Map).isRequired,
};

FilterSetManagerPanel.defaultProps = {
  panelState: null,
};

const mapStateToProps = (state, ownProps) => {
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

export default connect(
  mapStateToProps,
  {
    setDashboardFilterSets: setDashboardFilterSetsAction,
  },
  null,
  { forwardRef: true }
)(FilterSetManagerPanel);
