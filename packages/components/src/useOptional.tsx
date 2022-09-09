import React, {
  useCallback,
  useMemo,
  useState,
  ReactElement,
  FocusEventHandler,
} from 'react';
import { UISwitch } from '.';

const useOptional = (
  isOptional: boolean,
  defaultValue: string | undefined,
  onToggle: (isEnabled: boolean) => void,
  onBlur: (e: FocusEventHandler<HTMLButtonElement>) => void
): [boolean, ReactElement | null] => {
  const [isEnabled, setEnabled] = useState(
    !isOptional || defaultValue !== undefined
  );

  const handleClick = useCallback(() => {
    setEnabled(!isEnabled);
    onToggle(!isEnabled);
  }, [isEnabled, onToggle]);

  const toggleComponent = useMemo(
    () =>
      isOptional ? (
        <UISwitch on={isEnabled} onClick={handleClick} onBlur={onBlur} />
      ) : null,
    [isOptional, isEnabled, handleClick, onBlur]
  );

  return [isEnabled, toggleComponent];
};

export default useOptional;
