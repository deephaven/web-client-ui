import cl from 'classnames';
import { MultiSelect } from './MultiSelect';
import { type MultiSelectNormalizedProps } from './MultiSelectProps';
import { useMultiSelectNormalizedProps } from './useMultiSelectNormalizedProps';

/**
 * MultiSelect that takes an array of `NormalizedItem` or `NormalizedSection` items as children.
 * Handles converting selection keys and uses `useRenderNormalizedItem` to render items.
 */
export function MultiSelectNormalized({
  UNSAFE_className,
  ...props
}: MultiSelectNormalizedProps): JSX.Element {
  const { forceRerenderKey, children, ...multiSelectProps } =
    useMultiSelectNormalizedProps(props);

  return (
    <MultiSelect
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...multiSelectProps}
      key={forceRerenderKey}
      UNSAFE_className={cl('dh-multi-select-normalized', UNSAFE_className)}
    >
      {children}
    </MultiSelect>
  );
}

export default MultiSelectNormalized;
