import React from 'react';
import { Item, Picker } from '@adobe/react-spectrum';
import { useTheme, ThemeContextType } from '@deephaven/components';

function ThemeSectionContent(): React.ReactElement {
  const { colorScheme, setColorScheme } = useTheme();

  return (
    <Picker
      label="Pick a color scheme"
      items={[
        { id: 'light', name: 'Light' },
        { id: 'dark', name: 'Dark' },
      ]}
      selectedKey={colorScheme}
      onSelectionChange={selected =>
        setColorScheme(selected as ThemeContextType['colorScheme'])
      }
    >
      {item => <Item key={item.id}>{item.name}</Item>}
    </Picker>
  );
}

export default ThemeSectionContent;
