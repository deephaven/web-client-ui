import { Component, useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { nanoid } from 'nanoid';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  type PanelId,
  updateDashboardData,
  useListener,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { TextUtils } from '@deephaven/utils';
import { InputFilterEvent } from './events';
import {
  DropdownFilterPanel,
  FilterSetManagerPanel,
  InputFilterPanel,
  type WidgetId,
} from './panels';

const log = Log.module('FilterPlugin');

type Column = {
  name: string;
  type: string;
};

// A panel or widget can have columns for filters
export type FilterColumnSourceId = PanelId | WidgetId;

export type FilterChangeEvent = Column & {
  value: string;
  timestamp: number;
  excludePanelIds?: string[];
};

export type FilterPluginProps = Partial<DashboardPluginComponentProps>;

function flattenArray<T>(accumulator: T[], currentValue: T | T[]): T[] {
  return accumulator.concat(currentValue);
}

export function FilterPlugin(props: FilterPluginProps): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const { id: localDashboardId, layout, registerComponent } = props;
  const dispatch = useDispatch();
  const [panelColumns] = useState(
    () => new Map<FilterColumnSourceId, Column[]>()
  );
  const [panelFilters] = useState(
    () => new Map<Component, FilterChangeEvent[]>()
  );
  const [panelTables] = useState(() => new Map());

  const sendUpdate = useCallback(() => {
    const columns = Array.from(panelColumns.values())
      .reduce(flattenArray, [] as Column[])
      .sort((a, b) => {
        const aName = TextUtils.toLower(a.name);
        const bName = TextUtils.toLower(b.name);
        if (aName !== bName) {
          return aName > bName ? 1 : -1;
        }

        const aType = TextUtils.toLower(a.type);
        const bType = TextUtils.toLower(b.type);
        if (aType !== bType) {
          return aType > bType ? 1 : -1;
        }

        return 0;
      })
      .reduce((array, column) => {
        if (
          array.length === 0 ||
          TextUtils.toLower(array[array.length - 1].name) !==
            TextUtils.toLower(column.name) ||
          TextUtils.toLower(array[array.length - 1].type) !==
            TextUtils.toLower(column.type)
        ) {
          array.push(column);
        }

        return array;
      }, [] as Column[]);

    const filters = Array.from(panelFilters.values())
      .reduce(flattenArray, [] as FilterChangeEvent[])
      .sort((a, b) => a.timestamp - b.timestamp);
    const tableMap = new Map(panelTables);

    log.debug('sendUpdate', { columns, filters, tableMap });
    dispatch(
      updateDashboardData(localDashboardId, { columns, filters, tableMap })
    );
  }, [dispatch, localDashboardId, panelColumns, panelFilters, panelTables]);

  /**
   * Handler for the COLUMNS_CHANGED event.
   * @param sourceId The id of the component that's emitting the filter change
   * @param columns The columns in this panel
   */
  const handleColumnsChanged = useCallback(
    (sourceId: FilterColumnSourceId, columns: Column | Column[]) => {
      log.debug2('handleColumnsChanged', sourceId, columns);
      panelColumns.set(sourceId, ([] as Column[]).concat(columns));
      sendUpdate();
    },
    [panelColumns, sendUpdate]
  );

  /**
   * Handler for the FILTERS_CHANGED event.
   * @param {Component} panel The component that's emitting the filter change
   * @param {FilterChangeEvent|Array<FilterChangeEvent>} filters The input filters set by the panel
   */
  const handleFiltersChanged = useCallback(
    (panel, filters) => {
      log.debug2('handleFiltersChanged', panel, filters);
      panelFilters.set(panel, [].concat(filters) as FilterChangeEvent[]);
      sendUpdate();
    },
    [panelFilters, sendUpdate]
  );

  const handleTableChanged = useCallback(
    (panel, table) => {
      log.debug2('handleTableChanged', panel, table);
      panelTables.set(LayoutUtils.getIdFromPanel(panel), table);
      sendUpdate();
    },
    [panelTables, sendUpdate]
  );

  const handlePanelUnmount = useCallback(
    panel => {
      log.debug2('handlePanelUnmount', panel);
      const panelId = LayoutUtils.getIdFromPanel(panel);
      if (panelId != null) {
        panelColumns.delete(panelId);
      }
      panelFilters.delete(panel);
      panelTables.delete(panelId);
      sendUpdate();
    },
    [panelColumns, panelFilters, panelTables, sendUpdate]
  );

  const handleOpenDropdown = useCallback(
    ({
      title = 'DropdownFilter',
      metadata = {},
      panelState = null,
      id = nanoid(),
      focusElement = LayoutUtils.DEFAULT_FOCUS_SELECTOR,
      createNewStack = false,
      dragEvent = null,
    }) => {
      const config = {
        type: 'react-component' as const,
        component: DropdownFilterPanel.COMPONENT,
        props: { id, metadata, panelState, localDashboardId },
        title,
        id,
      };

      const { root } = layout;
      LayoutUtils.openComponent({
        root,
        config,
        focusElement,
        createNewStack,
        dragEvent,
      });
    },
    [layout, localDashboardId]
  );

  const handleOpenInput = useCallback(
    ({
      title = 'InputFilter',
      metadata = {},
      panelState = null,
      id = nanoid(),
      focusElement = LayoutUtils.DEFAULT_FOCUS_SELECTOR,
      createNewStack = false,
      dragEvent = undefined,
    }) => {
      const config = {
        type: 'react-component' as const,
        component: InputFilterPanel.COMPONENT,
        props: { id, metadata, panelState, localDashboardId },
        title,
        id,
      };

      const { root } = layout;
      LayoutUtils.openComponent({
        root,
        config,
        focusElement,
        createNewStack,
        dragEvent,
      });
    },
    [layout, localDashboardId]
  );

  const handleOpenFilterSetManager = useCallback(
    ({
      title = 'FilterSets',
      metadata = {},
      panelState = null,
      id = nanoid(),
      focusElement = LayoutUtils.DEFAULT_FOCUS_SELECTOR,
      createNewStack = false,
      dragEvent = null,
    }) => {
      const config = {
        type: 'react-component' as const,
        component: FilterSetManagerPanel.COMPONENT,
        props: { id, metadata, panelState, localDashboardId },
        title,
        id,
      };

      const { root } = layout;
      LayoutUtils.openComponent({
        root,
        config,
        focusElement,
        createNewStack,
        dragEvent,
      });
    },
    [layout, localDashboardId]
  );

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        registerComponent(DropdownFilterPanel.COMPONENT, DropdownFilterPanel),
        registerComponent(InputFilterPanel.COMPONENT, InputFilterPanel),
        registerComponent(
          FilterSetManagerPanel.COMPONENT,
          FilterSetManagerPanel
        ),
      ];

      return () => {
        cleanups.forEach(cleanup => cleanup());
      };
    },
    [registerComponent]
  );

  useListener(
    layout.eventHub,
    InputFilterEvent.COLUMNS_CHANGED,
    handleColumnsChanged
  );
  useListener(
    layout.eventHub,
    InputFilterEvent.FILTERS_CHANGED,
    handleFiltersChanged
  );
  useListener(
    layout.eventHub,
    InputFilterEvent.TABLE_CHANGED,
    handleTableChanged
  );
  useListener(
    layout.eventHub,
    InputFilterEvent.OPEN_DROPDOWN,
    handleOpenDropdown
  );
  useListener(layout.eventHub, InputFilterEvent.OPEN_INPUT, handleOpenInput);
  useListener(
    layout.eventHub,
    InputFilterEvent.OPEN_FILTER_SET_MANAGER,
    handleOpenFilterSetManager
  );
  useListener(layout.eventHub, PanelEvent.UNMOUNT, handlePanelUnmount);

  return null;
}

export default FilterPlugin;
