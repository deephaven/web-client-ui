import { useCallback, useMemo, useRef, useState } from 'react';
import { usePersistentState, type TablePluginElement } from '@deephaven/plugin';
import {
  type InputFilter,
  type IrisGridModel,
  type IrisGridProps,
  type IrisGridUtils,
  isIrisGridTableModelTemplate,
  type IrisGridType,
  type IrisGridContextMenuData,
} from '@deephaven/iris-grid';
import { type GridRange } from '@deephaven/grid';
import { TablePluginWrapper } from './TablePluginWrapper';

interface UseTablePluginProps {
  /**
   * The IrisGrid model for this plugin.
   * Currently only IrisGridTableModelTemplate types are supported.
   * Other IrisGrid model types will be ignored for now.
   */
  model: IrisGridModel | undefined;
  /**
   * A reference to the IrisGrid component instance.
   */
  irisGridRef: React.MutableRefObject<IrisGridType | null>;
  /**
   * A IrisGridUtils instance.
   */
  irisGridUtils: IrisGridUtils;
  /**
   * The currently selected ranges in the grid.
   */
  selectedRanges: readonly GridRange[] | undefined;
}

/**
 * Hook to get a TablePlugin component and the IrisGrid props derived from the plugin.
 * The returned props should be passed to the IrisGrid component or merged with other sources
 * of the same props.
 * @param props The properties for the table plugin. The props object itself does not need to be memoized,
 *              but the values inside it should be stable to avoid unnecessary re-renders.
 * @returns Object containing `Plugin` key which is the Plugin component.
 *          The remaining object keys are IrisGrid props associated with the plugin.
 */
export function useTablePlugin({
  model,
  irisGridRef,
  irisGridUtils,
  selectedRanges,
}: UseTablePluginProps): {
  Plugin: JSX.Element | null;
} & Pick<
  IrisGridProps,
  'customFilters' | 'alwaysFetchColumns' | 'onContextMenu'
> {
  const [pluginFilters, setPluginFilters] = useState<InputFilter[]>([]);
  const customFilters = useMemo(
    () =>
      model != null && isIrisGridTableModelTemplate(model)
        ? irisGridUtils.getFiltersFromInputFilters(
            model.table.columns,
            pluginFilters,
            model.formatter.timeZone
          )
        : [],
    [model, irisGridUtils, pluginFilters]
  );
  const [alwaysFetchColumns, setAlwaysFetchColumns] = useState<string[]>([]);
  const pluginRef = useRef<TablePluginElement | null>(null);
  const [pluginState, setPluginState] = usePersistentState<unknown>(undefined, {
    version: 1,
    // pluginName will be undefined on first call when re-hydrating,
    // so use a constant type to avoid re-hydration issues with the persistent state type
    type: 'GridWidgetTablePluginState',
  });

  const Plugin = useMemo(
    () =>
      model != null &&
      isIrisGridTableModelTemplate(model) &&
      model.table.pluginName != null ? (
        <TablePluginWrapper
          ref={pluginRef}
          name={model.table.pluginName}
          model={model}
          filter={setPluginFilters}
          fetchColumns={setAlwaysFetchColumns}
          selectedRanges={selectedRanges}
          irisGridRef={irisGridRef}
          pluginState={pluginState}
          onStateChange={setPluginState}
        />
      ) : null,
    [model, selectedRanges, irisGridRef, pluginState, setPluginState]
  );

  const onContextMenu = useCallback(
    (data: IrisGridContextMenuData) => pluginRef.current?.getMenu?.(data) ?? [],
    []
  );

  return {
    Plugin,
    customFilters,
    alwaysFetchColumns,
    onContextMenu,
  };
}

export default useTablePlugin;
