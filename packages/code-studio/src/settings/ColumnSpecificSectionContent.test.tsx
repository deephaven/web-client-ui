import { screen, render } from '@testing-library/react';
import { WorkspaceSettings } from '@deephaven/redux';
import React from 'react';
import {
  ColumnSpecificSectionContent,
  ColumnSpecificSectionContentProps,
} from './ColumnSpecificSectionContent';

const DEFAULT_DECIMAL_STRING = '###,#00.00';
const DEFAULT_INTEGER_STRING = '###,000';

function renderContent({
  formatter = [],
  defaultDateTimeFormat = '',
  showTimeZone = false,
  showTSeparator = false,
  timeZone = '',
  truncateNumbersWithPound = false,
  settings = {} as WorkspaceSettings,
  saveSettings = jest.fn(),
  scrollTo = undefined,
  defaultDecimalFormatOptions = {
    defaultFormatString: DEFAULT_DECIMAL_STRING,
  },
  defaultIntegerFormatOptions = {
    defaultFormatString: DEFAULT_INTEGER_STRING,
  },
}: Partial<ColumnSpecificSectionContentProps> = {}) {
  return render(
    <ColumnSpecificSectionContent
      formatter={formatter}
      defaultDateTimeFormat={defaultDateTimeFormat}
      showTimeZone={showTimeZone}
      showTSeparator={showTSeparator}
      timeZone={timeZone}
      truncateNumbersWithPound={truncateNumbersWithPound}
      settings={settings}
      saveSettings={saveSettings}
      scrollTo={scrollTo}
      defaultDecimalFormatOptions={defaultDecimalFormatOptions}
      defaultIntegerFormatOptions={defaultIntegerFormatOptions}
    />
  );
}

it('should mount with the default values correctly', async () => {
  renderContent();

  expect(await screen.queryByRole('input')).toBe(null);
});

it('can add a blank format rule', async () => {
  renderContent();
});
