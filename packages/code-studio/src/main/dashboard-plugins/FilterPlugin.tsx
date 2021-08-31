import Log from '@deephaven/log';
import React, {
  Component,
  ComponentType,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { TextUtils } from '@deephaven/utils';
import shortid from 'shortid';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import { InputFilterEvent, PanelEvent } from '../../dashboard/events';
import { DropdownFilterPanel, InputFilterPanel } from '../../dashboard/panels';
import LayoutUtils from '../../layout/LayoutUtils';

const log = Log.module('FilterPlugin');

type Column = {
  name: string;
  type: string;
};

export type FilterChangeEvent = Column & {
  value: string;
  timestamp: number;
  excludePanelIds?: string[];
};

function flattenArray<T>(accumulator: T[], currentValue: T | T[]): T[] {
  return accumulator.concat(currentValue);
}

export const FilterPlugin = ({
  id: localDashboardId,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const [panelColumns] = useState(() => new Map<Component, Column[]>());
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
    // TODO: Not yet implemented, need to update dashboard data
    log.warn('sendUpdate not implemented yet');
  }, [panelColumns, panelFilters, panelTables]);

  /**
   * Handler for the COLUMNS_CHANGED event.
   * @param panel The component that's emitting the filter change
   * @param {Column|Array<Column>} columns The columns in this panel
   */
  const handleColumnsChanged = useCallback(
    (panel: Component, columns) => {
      log.debug2('handleColumnsChanged', panel, columns);
      panelColumns.set(panel, [].concat(columns) as Column[]);
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
      panelColumns.delete(panel);
      panelFilters.delete(panel);
      panelTables.delete(LayoutUtils.getIdFromPanel(panel));
      sendUpdate();
    },
    [panelColumns, panelFilters, panelTables, sendUpdate]
  );

  const handleOpenDropdown = useCallback(
    ({
      title = 'DropdownFilter',
      metadata = {},
      panelState = null,
      id = shortid.generate(),
      focusElement = LayoutUtils.DEFAULT_FOCUS_SELECTOR,
      createNewStack = false,
      dragEvent = null,
    }) => {
      const config = {
        type: 'react-component',
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
      id = shortid.generate(),
      focusElement = LayoutUtils.DEFAULT_FOCUS_SELECTOR,
      createNewStack = false,
      dragEvent = null,
    }) => {
      const config = {
        type: 'react-component',
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

  useEffect(() => {
    const cleanups = [
      registerComponent(
        DropdownFilterPanel.COMPONENT,
        (DropdownFilterPanel as unknown) as ComponentType
      ),
      registerComponent(
        InputFilterPanel.COMPONENT,
        (InputFilterPanel as unknown) as ComponentType
      ),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  useEffect(() => {
    layout.eventHub.on(InputFilterEvent.COLUMNS_CHANGED, handleColumnsChanged);
    layout.eventHub.on(InputFilterEvent.FILTERS_CHANGED, handleFiltersChanged);
    layout.eventHub.on(InputFilterEvent.TABLE_CHANGED, handleTableChanged);
    layout.eventHub.on(InputFilterEvent.OPEN_DROPDOWN, handleOpenDropdown);
    layout.eventHub.on(InputFilterEvent.OPEN_INPUT, handleOpenInput);
    layout.eventHub.on(PanelEvent.UNMOUNT, handlePanelUnmount);
    return () => {
      layout.eventHub.off(
        InputFilterEvent.COLUMNS_CHANGED,
        handleColumnsChanged
      );
      layout.eventHub.off(
        InputFilterEvent.FILTERS_CHANGED,
        handleFiltersChanged
      );
      layout.eventHub.off(InputFilterEvent.TABLE_CHANGED, handleTableChanged);
      layout.eventHub.off(PanelEvent.UNMOUNT, handlePanelUnmount);
      layout.eventHub.off(InputFilterEvent.OPEN_DROPDOWN, handleOpenDropdown);
      layout.eventHub.off(InputFilterEvent.OPEN_INPUT, handleOpenInput);
    };
  }, [
    handleColumnsChanged,
    handleOpenDropdown,
    handleOpenInput,
    handleFiltersChanged,
    handlePanelUnmount,
    handleTableChanged,
    layout.eventHub,
  ]);

  return <></>;
};

export default FilterPlugin;
