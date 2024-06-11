import { useCallback, useState } from 'react';
import { ItemKey } from './itemUtils';

export interface UseOnChangeTrackUncontrolledOptions<TChangeKey> {
  defaultSelectedKey?: ItemKey;
  selectedKey?: ItemKey | null;
  onChange?: (key: TChangeKey) => void;
}

export interface UseOnChangeTrackUncontrolledResult<TChangeKey> {
  selectedKeyMaybeUncontrolled?: TChangeKey | ItemKey | null;
  onChangeMaybeUncontrolled: (key: TChangeKey) => void;
}

/**
 * Returns a selectedKey and onChange handler that can manage selection state
 * for both controlled and uncontrolled components. Useful for cases where a
 * component needs to always track its selection state regardless of its
 * controlled / uncontrolled status.
 */
export function useOnChangeTrackUncontrolled<TChangeKey>({
  defaultSelectedKey,
  selectedKey,
  onChange: onChangeHandler,
}: UseOnChangeTrackUncontrolledOptions<TChangeKey>): UseOnChangeTrackUncontrolledResult<TChangeKey> {
  // `null` is a valid value for `selectedKey` in controlled mode, so we check
  // for explicit `undefined` to identify uncontrolled mode.
  const isUncontrolled = selectedKey === undefined;
  const [uncontrolledSelectedKey, setUncontrolledSelectedKey] = useState<
    ItemKey | TChangeKey | undefined
  >(defaultSelectedKey);

  const onChangeMaybeUncontrolled = useCallback(
    (key: TChangeKey): void => {
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
