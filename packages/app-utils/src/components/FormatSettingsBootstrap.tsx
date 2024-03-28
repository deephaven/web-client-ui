import { FormatSettingsContext } from '@deephaven/jsapi-components';
import { getSettings, RootState } from '@deephaven/redux';
import { useSelector } from 'react-redux';

export interface FormatSettingsBootstrapProps {
  children: React.ReactNode;
}

/**
 * Get formatter settings from the Redux store and provide them via a
 * FormatSettingsContext.Provider.
 */
export function FormatSettingsBootstrap({
  children,
}: FormatSettingsBootstrapProps): JSX.Element {
  const settings = useSelector(getSettings<RootState>);

  return (
    <FormatSettingsContext.Provider value={settings}>
      {children}
    </FormatSettingsContext.Provider>
  );
}

export default FormatSettingsBootstrap;
