import { forwardRef, useMemo } from 'react';
import {
  type TablePluginProps,
  type TablePluginElement,
} from '@deephaven/plugin';
import { type IrisGridType } from '@deephaven/iris-grid';
import {
  LayoutUtils,
  useLayoutManager,
  usePanelId,
} from '@deephaven/dashboard';
import useLoadTablePlugin from './useLoadTablePlugin';

export const TablePluginWrapper = forwardRef(
  (
    {
      name,
      model,
      filter,
      fetchColumns,
      selectedRanges,
      irisGridRef,
      pluginState,
      onStateChange,
    }: Pick<
      TablePluginProps,
      | 'model'
      | 'filter'
      | 'fetchColumns'
      | 'selectedRanges'
      | 'pluginState'
      | 'onStateChange'
    > & {
      name: string;
      irisGridRef: React.MutableRefObject<IrisGridType | null>;
    },
    ref: React.Ref<TablePluginElement>
  ): JSX.Element | null => {
    const loadPlugin = useLoadTablePlugin();
    const Plugin = useMemo(() => loadPlugin(name), [loadPlugin, name]);

    const layoutManager = useLayoutManager();
    const panelId = usePanelId();
    const panelName = useMemo(() => {
      if (panelId == null) {
        return 'unknown';
      }

      const panelItem = LayoutUtils.getContentItemById(
        layoutManager.root,
        panelId
      );

      return panelItem?.config.title ?? 'unknown';
    }, [layoutManager.root, panelId]);

    return (
      <div className="iris-grid-plugin">
        <Plugin
          ref={ref}
          filter={filter}
          fetchColumns={fetchColumns}
          model={model}
          table={model.table}
          tableName={panelName}
          selectedRanges={selectedRanges}
          onStateChange={onStateChange}
          pluginState={pluginState}
          // Mimic the panel containing `irisGrid.current` for backwards compatibility
          // since we don't have an IrisGridPanel to use here.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          panel={{
            irisGrid: irisGridRef,
            getTableName: () => panelName,
          }}
        />
      </div>
    );
  }
);

TablePluginWrapper.displayName = 'TablePluginWrapper';

export default TablePluginWrapper;
