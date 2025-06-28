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
  model: IrisGridModel | undefined;
  irisGridRef: React.MutableRefObject<IrisGridType | null>;
  irisGridUtils: IrisGridUtils;
  selectedRanges: readonly GridRange[] | undefined;
}

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
