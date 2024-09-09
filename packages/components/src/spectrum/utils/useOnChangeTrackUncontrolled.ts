import { useCallback, useState } from 'react';
import { ItemKey } from './itemUtils';

export interface UseOnChangeTrackUncontrolledOptions {
  defaultSelectedKey?: ItemKey;
  selectedKey?: ItemKey | null;
  onChange?: (key: ItemKey | null) => void;
}

export interface UseOnChangeTrackUncontrolledResult {
  selectedKeyMaybeUncontrolled?: ItemKey | null;
  onChangeMaybeUncontrolled: (key: ItemKey | null) => void;
}

/**
 * Returns a selectedKey and onChange handler that can manage selection state
 * for both controlled and uncontrolled components. Useful for cases where a
 * component needs to always track its selection state regardless of its
 * controlled / uncontrolled status.
 */
export function useOnChangeTrackUncontrolled({
  defaultSelectedKey,
  selectedKey,
  onChange: onChangeHandler,
}: UseOnChangeTrackUncontrolledOptions): UseOnChangeTrackUncontrolledResult {
  // `null` is a valid value for `selectedKey` in controlled mode, so we check
  // for explicit `undefined` to identify uncontrolled mode.
  const isUncontrolled = selectedKey === undefined;
  const [uncontrolledSelectedKey, setUncontrolledSelectedKey] = useState<
    ItemKey | null | undefined
  >(defaultSelectedKey);

  const onChangeMaybeUncontrolled = useCallback(
    (key: ItemKey | null): void => {
      // If our component is uncontrolled, track the selected key internally
      if (isUncontrolled) {
        setUncontrolledSelectedKey(key);
      }

      onChangeHandler?.(key);
    },
    [isUncontrolled, onChangeHandler]
  );

  return {
    selectedKeyMaybeUncontrolled: isUncontrolled
      ? uncontrolledSelectedKey
      : selectedKey,
    onChangeMaybeUncontrolled,
  };
}

export default useOnChangeTrackUncontrolled;
