import React, { useCallback } from 'react';
import {
  Item,
  ItemKey,
  Picker,
  ThemePicker,
  useTheme,
} from '@deephaven/components';
import { assertNotNull } from '@deephaven/utils';
import { useDispatch, useSelector } from 'react-redux';
import { getSettings, updateSettings, type RootState } from '@deephaven/redux';

export function ThemeSectionContent(): JSX.Element {
  const theme = useTheme();
  const settings = useSelector<RootState, ReturnType<typeof getSettings>>(
    getSettings
  );
  const dispatch = useDispatch();

  const updateDensity = useCallback(
    (density: ItemKey | null) => {
      if (
        density !== 'normal' &&
        density !== 'compact' &&
        density !== 'spacious'
      ) {
        throw new Error(`Invalid grid density value: ${density}`);
      }
      dispatch(updateSettings({ gridDensity: density }));
    },
    [dispatch]
  );

  const density = settings.gridDensity ?? 'normal';

  assertNotNull(theme, 'ThemeContext value is null');

  return (
    <>
      <ThemePicker />
      <Picker
        label="Choose grid density"
        selectedKey={density}
        onChange={updateDensity}
      >
        <Item key="normal">Normal</Item>
        <Item key="compact">Compact</Item>
        <Item key="spacious">Spacious</Item>
      </Picker>
    </>
  );
}

export default ThemeSectionContent;
