import React, { useCallback } from 'react';
import { vsTools } from '@deephaven/icons';
import AdvancedSettingsMenu from '../../sidebar/AdvancedSettingsMenu';
import type AdvancedSettingsType from '../../sidebar/AdvancedSettingsType';
import { useTableOptionsHost } from '../TableOptionsHostContext';
import type { TableOption, TableOptionPanelProps } from '../TableOption';

/**
 * Panel component for Advanced Settings option.
 * Wraps the existing AdvancedSettingsMenu component.
 */
function AdvancedSettingsPanel(_props: TableOptionPanelProps): JSX.Element {
  const { gridState, dispatch } = useTableOptionsHost();
  const { advancedSettings } = gridState;

  const handleChange = useCallback(
    (key: AdvancedSettingsType, isOn: boolean) => {
      dispatch({ type: 'SET_ADVANCED_SETTING', key, isOn });
    },
    [dispatch]
  );

  return (
    <AdvancedSettingsMenu
      items={advancedSettings ?? new Map()}
      onChange={handleChange}
    />
  );
}

/**
 * Advanced Settings option configuration.
 * Shows when there are advanced settings available.
 */
export const AdvancedSettingsOption: TableOption = {
  type: 'advanced-settings',

  menuItem: {
    title: 'Advanced Settings',
    icon: vsTools,
    isAvailable: gridState => gridState.hasAdvancedSettings ?? false,
  },

  Panel: AdvancedSettingsPanel,
};

export default AdvancedSettingsOption;
