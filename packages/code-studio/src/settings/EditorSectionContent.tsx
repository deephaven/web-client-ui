import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Switch, ActionButton, Icon, Text } from '@deephaven/components';
import { useAppSelector } from '@deephaven/dashboard';
import { getNotebookSettings, updateNotebookSettings } from '@deephaven/redux';
import { vsSettings } from '@deephaven/icons';
import {
  MonacoProviders,
  RuffSettingsModal,
  RUFF_DEFAULT_SETTINGS,
} from '@deephaven/console';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function EditorSectionContent(): JSX.Element {
  const notebookSettings = useAppSelector(getNotebookSettings);
  const dispatch = useDispatch();
  const {
    isMinimapEnabled,
    formatOnSave,
    ruffSettings = {},
  } = notebookSettings;
  const { isEnabled: ruffEnabled, config: ruffConfig = RUFF_DEFAULT_SETTINGS } =
    ruffSettings;

  const handleMinimapChange = useCallback(
    (newValue: boolean) =>
      dispatch(updateNotebookSettings({ isMinimapEnabled: newValue })),
    [dispatch]
  );

  const handleFormatOnSaveChange = useCallback(
    (newValue: boolean) =>
      dispatch(updateNotebookSettings({ formatOnSave: newValue })),
    [dispatch]
  );

  const handleRuffEnabledChange = useCallback(
    (newValue: boolean) => {
      dispatch(
        updateNotebookSettings({
          ruffSettings: { ...ruffSettings, isEnabled: newValue },
        })
      );
      MonacoProviders.isRuffEnabled = newValue;
      MonacoProviders.setRuffSettings(ruffConfig);
    },
    [dispatch, ruffSettings, ruffConfig]
  );

  const handleRuffConfigChange = useCallback(
    (newValue: Record<string, unknown>) => {
      dispatch(
        updateNotebookSettings({
          ruffSettings: { ...ruffSettings, config: newValue },
        })
      );
      MonacoProviders.setRuffSettings(newValue);
    },
    [dispatch, ruffSettings]
  );

  const [val, setVal] = useState(JSON.stringify(ruffConfig, null, 2));

  const [isRuffSettingsOpen, setIsRuffSettingsOpen] = useState(false);

  const handleRuffSettingsClose = useCallback(
    (v: Record<string, unknown>) => {
      setIsRuffSettingsOpen(false);
      handleRuffConfigChange(v);
      console.log(v);
      setVal(JSON.stringify(v, null, 2));
    },
    [handleRuffConfigChange]
  );

  return (
    <>
      <div className="app-settings-menu-description">
        Customize the notebook editor.
      </div>

      <div className="form-row pl-1">
        <Switch isSelected={isMinimapEnabled} onChange={handleMinimapChange}>
          Enable Minimap
        </Switch>
      </div>
      <div className="form-row pl-1">
        <Switch isSelected={formatOnSave} onChange={handleFormatOnSaveChange}>
          Format on Save
        </Switch>
      </div>
      <div className="form-row pl-1">
        <Switch
          isSelected={ruffEnabled}
          onChange={handleRuffEnabledChange}
          marginEnd={0}
        >
          Enable Ruff Python Linter
        </Switch>
      </div>
      <div className="form-row pl-1">
        <ActionButton onPress={() => setIsRuffSettingsOpen(true)}>
          <Icon>
            <FontAwesomeIcon icon={vsSettings} />
          </Icon>
          <Text>Customize Ruff Settings</Text>
        </ActionButton>
      </div>
      {isRuffSettingsOpen && (
        <RuffSettingsModal
          text={val}
          isOpen={isRuffSettingsOpen}
          onClose={handleRuffSettingsClose}
        />
      )}
    </>
  );
}

export default EditorSectionContent;
