import { useMemo } from 'react';
import cl from 'classnames';
import { LIST_VIEW_ICON_SIZES } from '@deephaven/utils';
import {
  NormalizedItem,
  normalizeTooltipOptions,
  useRenderNormalizedItem,
  useStringifiedMultiSelection,
} from '../utils';
import type { ListViewProps } from './ListView';
import { ListViewWrapper } from './ListViewWrapper';
import { useSpectrumThemeProvider } from '../../theme';

export interface ListViewNormalizedProps
  extends Omit<ListViewProps, 'children'> {
  normalizedItems: NormalizedItem[];
  showItemIcons: boolean;
}

export function ListViewNormalized({
  normalizedItems,
  tooltip = true,
  selectedKeys,
  defaultSelectedKeys,
  disabledKeys,
  showItemIcons,
  UNSAFE_className,
  onChange,
  onSelectionChange,
  ...props
}: ListViewNormalizedProps): JSX.Element {
  const { scale } = useSpectrumThemeProvider();

  const iconSize = LIST_VIEW_ICON_SIZES[props.density ?? 'regular'][scale];

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
    iconSize,
  });

  // Spectrum doesn't re-render if only the `renderNormalizedItems` function
  // changes, so we create a key from its dependencies that can be used to force
  // re-render.
  const forceRerenderKey = `${showItemIcons}-${tooltipOptions?.placement}-${iconSize}`;

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
