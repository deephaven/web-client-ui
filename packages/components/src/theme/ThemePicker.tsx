import { type Key, useCallback } from 'react';
import { Item, Picker } from '@adobe/react-spectrum';
import useTheme from './useTheme';

export function ThemePicker(): JSX.Element | null {
  const { selectedThemeKey, setSelectedThemeKey, themes } = useTheme();

  const onSelectionChange = useCallback(
    (key: Key) => {
      setSelectedThemeKey(key as string);
    },
    [setSelectedThemeKey]
  );

  return (
    <Picker
      label="Pick a color scheme"
      items={themes}
      selectedKey={selectedThemeKey}
      onSelectionChange={onSelectionChange}
    >
      {item => <Item key={item.themeKey}>{item.name}</Item>}
    </Picker>
  );
}

export default ThemePicker;
