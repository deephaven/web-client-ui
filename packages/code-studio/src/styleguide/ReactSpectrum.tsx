import {
  ActionButton,
  Button,
  DatePicker,
  Item,
  ListView,
  Picker,
  RangeSlider,
  Switch,
  Flex,
  Text,
  TextField,
  Well,
  Link,
  Heading,
  Divider,
} from '@adobe/react-spectrum';
import React from 'react';
import {
  useTheme,
  useThemeVariables,
  ThemeContextType,
} from '@deephaven/components';

const grays = [
  'gray-50',
  'gray-75',
  'gray-100',
  'gray-200',
  'gray-300',
  'gray-400',
  'gray-500',
  'gray-600',
  'gray-700',
  'gray-800',
  'gray-900',
];
const colors = [
  'red',
  'orange',
  'yellow',
  'chartreuse',
  'celery',
  'green',
  'seafoam',
  'cyan',
  'blue',
  'indigo',
  'purple',
  'fuchsia',
  'magenta',
];
const values = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400,
];

const theme = {
  text: '--spectrum-alias-text-color',
};

function ReactSpectrum(): React.ReactElement {
  const { colorScheme, setColorScheme } = useTheme();
  const myTheme = useThemeVariables(theme);

  return (
    <div>
      <Heading level={2} id="spectrum">
        React Spectrum
      </Heading>
      <Divider size="M" marginBottom="size-100" />

      <Flex
        direction="column"
        gap="size-100"
        position="fixed"
        UNSAFE_style={{ left: '10px', top: '10px' }}
      >
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

        {/* eslint-disable jsx-a11y/anchor-is-valid */}
        <Link>
          <a href="#spectrum">Spectrum</a>
        </Link>
        <Link>
          <a href="#monaco">Monaco</a>
        </Link>
        <Link>
          <a href="#iris-grid">Iris Grid</a>
        </Link>
        {/* eslint-enable jsx-a11y/anchor-is-valid */}
      </Flex>

      <Flex direction="column" gap="size-100">
        <Well>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Well>

        <Text UNSAFE_style={{ color: myTheme?.text }}>
          <pre>{JSON.stringify(myTheme, null, 2)}</pre>
        </Text>

        <Flex alignItems="end" gap="size-100">
          <ActionButton>Test</ActionButton>
          <ActionButton isQuiet>Test</ActionButton>
          <Button variant="accent">Test</Button>
          <Button variant="accent" style="outline">
            Test
          </Button>
          <Button variant="primary" style="fill">
            Test
          </Button>
          <Button variant="primary">Test</Button>
          <Button variant="accent" isDisabled>
            Disabled
          </Button>
          <Button variant="negative" style="fill">
            Test
          </Button>
          <Button variant="negative">Test</Button>
          <RangeSlider label="Range" defaultValue={{ start: 12, end: 36 }} />
          <TextField label="Text field" />
        </Flex>
        <Flex>
          <DatePicker label="Event date" />
        </Flex>
        <ListView
          selectionMode="multiple"
          aria-label="Static ListView items example"
          maxWidth="size-6000"
        >
          <Item>Lorem ipsum</Item>
          <Item>Dolar sit</Item>
          <Item>Amet</Item>
          <Item>Consectetur</Item>
          <Item>Adipiscing elit</Item>
        </ListView>
        <Switch isEmphasized>Low power mode</Switch>
      </Flex>

      <div className="row">
        <div className="col">
          <div className="swatch">Gray</div>
          {grays.map(gray => (
            <div
              key={gray}
              className="swatch"
              style={{ background: `var(--spectrum-${gray})`, color: 'black' }}
            >
              {gray.substring(5)}
            </div>
          ))}
        </div>

        {colors.map(color => (
          <div key={color} className="col">
            <div className="swatch">{color}</div>
            {values.map(value => (
              <div
                key={color + value}
                className="swatch"
                style={{
                  background: `var(--spectrum-${color}-${value})`,
                  color: 'black',
                }}
              >
                {value}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReactSpectrum;
