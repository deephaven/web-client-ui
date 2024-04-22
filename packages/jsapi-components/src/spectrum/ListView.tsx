import {
  ListViewNormalized,
  ListViewNormalizedProps,
  NormalizedItemData,
  useSpectrumThemeProvider,
} from '@deephaven/components';
import { dh as DhType } from '@deephaven/jsapi-types';
import { Settings } from '@deephaven/jsapi-utils';
import { LIST_VIEW_ROW_HEIGHTS } from '@deephaven/utils';
import useFormatter from '../useFormatter';
import useViewportData from '../useViewportData';
import { useItemRowDeserializer } from './utils';

export interface ListViewProps extends ListViewNormalizedProps {
  table: DhType.Table;
  /* The column of values to use as item keys. Defaults to the first column. */
  keyColumn?: string;
  /* The column of values to display as primary text. Defaults to the `keyColumn` value. */
  labelColumn?: string;

  // TODO #1890 : descriptionColumn, iconColumn

  settings?: Settings;
}

export function ListView({
  table,
  keyColumn: keyColumnName,
  labelColumn: labelColumnName,
  settings,
  ...props
}: ListViewProps): JSX.Element {
  const { scale } = useSpectrumThemeProvider();
  const itemHeight = LIST_VIEW_ROW_HEIGHTS[props.density ?? 'regular'][scale];

  const { getFormattedString: formatValue } = useFormatter(settings);

  const deserializeRow = useItemRowDeserializer({
    table,
    keyColumnName,
    labelColumnName,
    formatValue,
  });

  const { viewportData, onScroll } = useViewportData<
    NormalizedItemData,
    DhType.Table
  >({
    reuseItemsOnTableResize: true,
    table,
    itemHeight,
    deserializeRow,
  });

  return (
    <ListViewNormalized
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      normalizedItems={viewportData.items}
      onScroll={onScroll}
    />
  );
}

export default ListView;
