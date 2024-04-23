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

  /* The column of values to display as descriptions. */
  descriptionColumn?: string;

  /* The column of values to map to icons. */
  iconColumn?: string;

  settings?: Settings;
}

export function ListView({
  table,
  keyColumn: keyColumnName,
  labelColumn: labelColumnName,
  iconColumn: iconColumnName,
  settings,
  ...props
}: ListViewProps): JSX.Element {
  const { scale } = useSpectrumThemeProvider();
  const itemHeight = LIST_VIEW_ROW_HEIGHTS[props.density ?? 'regular'][scale];

  const { getFormattedString: formatValue } = useFormatter(settings);

  const deserializeRow = useItemRowDeserializer({
    table,
    iconColumnName,
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
      showItemIcons={iconColumnName != null}
      onScroll={onScroll}
    />
  );
}

export default ListView;
