import Log from '@deephaven/log';
import React, {
  Component,
  ComponentType,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { TextUtils } from '@deephaven/utils';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import { InputFilterEvent, PanelEvent } from '../../dashboard/events';
import { DropdownFilterPanel, InputFilterPanel } from '../../dashboard/panels';
import LayoutUtils from '../../layout/LayoutUtils';

const log = Log.module('FilterPlugin');

export function flattenArray<T>(accumulator: T[], currentValue: T | T[]): T[] {
  return accumulator.concat(currentValue);
}

type Column = {
  name: string;
  type: string;
};

export const FilterPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const [panelColumns] = useState(() => new Map<Component, Column>());
  const [panelFilters] = useState(() => new Map());
  const [panelTables] = useState(() => new Map());

  const sendUpdate = useCallback(() => {
    const columns = Array.from(panelColumns.values())
      .reduce(flattenArray, [])
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
      }, []);

    const filters = [...panelFilters.values()]
      .reduce(flattenArray, [])
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
      panelColumns.set(panel, [].concat(columns));
      sendUpdate();
    },
    [panelColumns, sendUpdate]
  );

  /**
   * Handler for the FILTERS_CHANGED event.
   * @param {Component} panel The component that's emitting the filter change
   * @param {InputFilter|Array<InputFilter>} filters The input filters set by the panel
   */
  const handleFiltersChanged = useCallback(
    (panel, filters) => {
      log.debug2('handleFiltersChanged', panel, filters);
      panelFilters.set(panel, [].concat(filters));
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
    };
  }, [
    handleColumnsChanged,
    handleFiltersChanged,
    handlePanelUnmount,
    handleTableChanged,
    layout.eventHub,
  ]);

  return <></>;
};

export default FilterPlugin;
