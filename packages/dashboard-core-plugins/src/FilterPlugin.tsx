import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { nanoid } from 'nanoid';
import {
  assertIsDashboardPluginProps,
  type DashboardPluginComponentProps,
  LayoutUtils,
  type PanelComponent,
  PanelEvent,
  updateDashboardData,
  useListener,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { TextUtils } from '@deephaven/utils';
import { type dh } from '@deephaven/jsapi-types';
import { InputFilterEvent } from './events';
import {
  DropdownFilterPanel,
  FilterSetManagerPanel,
  InputFilterPanel,
} from './panels';
import {
  type FilterColumn,
  type FilterChangeEvent,
  type FilterColumnSourceId,
  useFilterChangedListener,
  useFilterColumnsChangedListener,
  useFilterTableChangedListener,
} from './FilterEvents';

const log = Log.module('FilterPlugin');

export type FilterPluginProps = Partial<DashboardPluginComponentProps>;

export function FilterPlugin(props: FilterPluginProps): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const { id: localDashboardId, layout, registerComponent } = props;
  const dispatch = useDispatch();
  const [panelColumns] = useState(
    () => new Map<FilterColumnSourceId, FilterColumn[]>()
  );
  const [panelFilters] = useState(
    () => new Map<FilterColumnSourceId, FilterChangeEvent[]>()
  );
  const [panelTables] = useState(
    () => new Map<FilterColumnSourceId, dh.Table>()
  );

  const sendUpdate = useCallback(() => {
    const columns = Array.from(panelColumns.values())
      .flat()
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
      }, [] as FilterColumn[]);

    const filters = Array.from(panelFilters.values())
      .flat()
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
   * @param columns The columns in this panel. Null to clear the columns.
   */
  const handleColumnsChanged = useCallback(
    (
      sourceId: FilterColumnSourceId,
      columns: readonly FilterColumn[] | null
    ) => {
      log.debug2('handleColumnsChanged', sourceId, columns);
      if (columns == null) {
        panelColumns.delete(sourceId);
      } else {
        panelColumns.set(sourceId, ([] as FilterColumn[]).concat(columns));
      }
      sendUpdate();
    },
    [panelColumns, sendUpdate]
  );

  /**
   * Handler for the FILTERS_CHANGED event.
   * @param sourceId The id of the component that's emitting the filter change
   * @param filters The input filters set by the panel
   */
  const handleFiltersChanged = useCallback(
    (
      sourceId: FilterColumnSourceId,
      filters: FilterChangeEvent | FilterChangeEvent[] | null
    ) => {
      log.debug2('handleFiltersChanged', sourceId, filters);
      if (filters == null) {
        panelFilters.delete(sourceId);
      } else {
        panelFilters.set(
          sourceId,
          ([] as FilterChangeEvent[]).concat(filters ?? [])
        );
      }
      sendUpdate();
    },
    [panelFilters, sendUpdate]
  );

  const handleTableChanged = useCallback(
    (sourceId: FilterColumnSourceId, table: dh.Table | null) => {
      log.debug2('handleTableChanged', sourceId, table);
      if (table == null) {
        panelTables.delete(sourceId);
      } else {
        panelTables.set(sourceId, table);
      }
      sendUpdate();
    },
    [panelTables, sendUpdate]
  );

  const handlePanelUnmount = useCallback(
    (panel: PanelComponent) => {
      log.debug2('handlePanelUnmount', panel);
      const panelId = LayoutUtils.getIdFromPanel(panel);
      if (panelId != null) {
        panelColumns.delete(panelId);
        panelTables.delete(panelId);
        panelFilters.delete(panelId);
      }
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

  useFilterColumnsChangedListener(layout.eventHub, handleColumnsChanged);
  useFilterChangedListener(layout.eventHub, handleFiltersChanged);
  useFilterTableChangedListener(layout.eventHub, handleTableChanged);
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
