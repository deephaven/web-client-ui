import React, { useCallback } from 'react';
import {
  Item,
  ItemKey,
  Picker,
  ThemePicker,
  useTheme,
} from '@deephaven/components';
import { assertNotNull } from '@deephaven/utils';
import { useDispatch } from 'react-redux';
import { getSettings, updateSettings } from '@deephaven/redux';
import { useAppSelector } from '@deephaven/dashboard';

export function ThemeSectionContent(): JSX.Element {
  const theme = useTheme();
  const settings = useAppSelector(getSettings);
  const dispatch = useDispatch();

  const updateDensity = useCallback(
    (density: ItemKey | null) => {
      if (
        density !== 'regular' &&
        density !== 'compact' &&
        density !== 'spacious'
      ) {
        throw new Error(`Invalid grid density value: ${density}`);
      }
      dispatch(updateSettings({ gridDensity: density }));
    },
    [dispatch]
  );

  const density = settings.gridDensity;

  assertNotNull(theme, 'ThemeContext value is null');

  return (
    <>
      <ThemePicker />
      <Picker
        label="Default table density"
        selectedKey={density}
        onChange={updateDensity}
      >
        <Item key="regular">Regular</Item>
        <Item key="compact">Compact</Item>
        <Item key="spacious">Spacious</Item>
      </Picker>
    </>
  );
}

export default ThemeSectionContent;
