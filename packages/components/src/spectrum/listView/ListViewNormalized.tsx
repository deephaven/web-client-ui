import { useMemo } from 'react';
import cl from 'classnames';
import {
  ListActions,
  NormalizedItem,
  normalizeTooltipOptions,
  useRenderNormalizedItem,
  useStringifiedMultiSelection,
} from '../utils';
import type { ListViewProps } from './ListView';
import { ListViewWrapper } from './ListViewWrapper';

export interface ListViewNormalizedProps
  extends Omit<ListViewProps, 'children'> {
  normalizedItems: NormalizedItem[];
  showItemIcons: boolean;
  actions?: ListActions<unknown>;
}

/**
 * ListView supporting normalized item data. This component mostly exists to
 * decouple some of the logic needed to support table data. Specifically it
 * handles item rendering configurations as well as converting selection keys
 * to / from strings. This makes it easier to test logic in isolation without
 * a dependency on JS apis (e.g. in the Styleguide).
 *
 * Note that This component will usually not be used directly. Instead, it is
 * recommended to use
 * - `@deephaven/components`'s `ListView` for non-table data sources
 * - `@deephaven/jsapi-components`'s `ListView` for table data sources
 */
export function ListViewNormalized({
  normalizedItems,
  tooltip = true,
  selectedKeys,
  defaultSelectedKeys,
  disabledKeys,
  showItemIcons,
  actions,
  UNSAFE_className,
  onChange,
  onSelectionChange,
  ...props
}: ListViewNormalizedProps): JSX.Element {
  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip, 'bottom'),
    [tooltip]
  );

  const renderNormalizedItem = useRenderNormalizedItem({
    itemIconSlot: 'illustration',
    // Descriptions introduce variable item heights which throws off setting
    // viewport on windowed data. For now not going to implement description
    // support in Picker.
    // https://github.com/deephaven/web-client-ui/issues/1958
    showItemDescriptions: false,
    showItemIcons,
    tooltipOptions,
    actions,
  });

  // Spectrum doesn't re-render if only the `renderNormalizedItems` function
  // changes, so we create a key from its dependencies that can be used to force
  // re-render.
  const forceRerenderKey = `${showItemIcons}-${tooltipOptions?.placement}`;

  const {
    selectedStringKeys,
    defaultSelectedStringKeys,
    disabledStringKeys,
    onStringSelectionChange,
  } = useStringifiedMultiSelection({
    normalizedItems,
    selectedKeys,
    defaultSelectedKeys,
    disabledKeys,
    onChange: onChange ?? onSelectionChange,
  });

  return (
    <ListViewWrapper
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      UNSAFE_className={cl('dh-list-view-normalized', UNSAFE_className)}
      key={forceRerenderKey}
      items={normalizedItems}
      selectedKeys={selectedStringKeys}
      defaultSelectedKeys={defaultSelectedStringKeys}
      disabledKeys={disabledStringKeys}
      onSelectionChange={onStringSelectionChange}
    >
      {renderNormalizedItem}
    </ListViewWrapper>
  );
}

export default ListViewNormalized;
