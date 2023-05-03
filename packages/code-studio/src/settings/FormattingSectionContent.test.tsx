import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dh from '@deephaven/jsapi-shim';
import { DateTimeColumnFormatter } from '@deephaven/jsapi-utils';
import { WorkspaceSettings } from '@deephaven/redux';
import { assertNotNull } from '@deephaven/utils';
import { FormattingSectionContent } from './FormattingSectionContent';

const DEFAULT_DECIMAL_STRING = '###,#00.00';
const DEFAULT_INTEGER_STRING = '###,000';

function makeDefaults(overrides = {}) {
  return {
    defaultDateTimeFormat:
      DateTimeColumnFormatter.DEFAULT_DATETIME_FORMAT_STRING,
    defaultDecimalFormatOptions: {
      defaultFormatString: DEFAULT_DECIMAL_STRING,
    },
    defaultIntegerFormatOptions: {
      defaultFormatString: DEFAULT_INTEGER_STRING,
    },
    showTimeZone: false,
    showTSeparator: true,
    timeZone: DateTimeColumnFormatter.DEFAULT_TIME_ZONE_ID,
    ...overrides,
  };
}

function renderSectionContent({
  settings = {},
  formatter = [],
  showTimeZone = true,
  showTSeparator = false,
  timeZone = '',
  defaultDateTimeFormat = '',
  saveSettings = jest.fn(),
  scrollTo = jest.fn(),
  defaultDecimalFormatOptions = {
    defaultFormatString: DEFAULT_DECIMAL_STRING,
  },
  defaultIntegerFormatOptions = {
    defaultFormatString: DEFAULT_INTEGER_STRING,
  },
  defaults = makeDefaults(),
  truncateNumbersWithPound = false,
} = {}) {
  return render(
    <FormattingSectionContent
      dh={dh}
      settings={settings as WorkspaceSettings}
      formatter={formatter}
      showTimeZone={showTimeZone}
      showTSeparator={showTSeparator}
      timeZone={timeZone}
      defaultDateTimeFormat={defaultDateTimeFormat}
      truncateNumbersWithPound={truncateNumbersWithPound}
      saveSettings={saveSettings}
      scrollTo={scrollTo}
      defaultDecimalFormatOptions={defaultDecimalFormatOptions}
      defaultIntegerFormatOptions={defaultIntegerFormatOptions}
      defaults={defaults}
    />
  );
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('should mount and unmount without errors', () => {
  expect(() => renderSectionContent()).not.toThrow();
});

describe('default decimal formatting', () => {
  it('shows the currently set default', () => {
    const { getByLabelText, unmount } = renderSectionContent();
    expect((getByLabelText('Decimal') as HTMLOptionElement).value).toEqual(
      DEFAULT_DECIMAL_STRING
    );
    unmount();
  });

  it('updates settings when value is changed', async () => {
    const user = userEvent.setup({ delay: null });
    const saveSettings = jest.fn();
    const { getByLabelText, unmount } = renderSectionContent({ saveSettings });
    const newFormat = '00.0';
    const input = getByLabelText('Decimal');
    await user.clear(input);
    await user.type(input, newFormat);

    jest.runOnlyPendingTimers();

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultDecimalFormatOptions: { defaultFormatString: newFormat },
      })
    );

    unmount();
  });

  it('resets to default', async () => {
    const user = userEvent.setup({ delay: null });
    const saveSettings = jest.fn();
    const defaultFormatOptions = {
      defaultFormatString: DEFAULT_DECIMAL_STRING,
    };
    renderSectionContent({
      saveSettings,
      defaultDecimalFormatOptions: {
        defaultFormatString: '000',
      },
      defaults: makeDefaults({
        defaultDecimalFormatOptions: defaultFormatOptions,
      }),
    });

    const element = screen.getByTestId('btn-reset-decimal');
    expect(element).not.toBeNull();
    assertNotNull(element);
    await user.click(element);

    jest.runOnlyPendingTimers();

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultDecimalFormatOptions: defaultFormatOptions,
      })
    );
  });
});

describe('default integer formatting', () => {
  it('shows the currently set default', () => {
    const { getByLabelText, unmount } = renderSectionContent();
    expect((getByLabelText('Integer') as HTMLOptionElement).value).toEqual(
      DEFAULT_INTEGER_STRING
    );
    unmount();
  });

  it('updates settings when value is changed', async () => {
    const user = userEvent.setup({ delay: null });
    const saveSettings = jest.fn();
    const { getByLabelText, unmount } = renderSectionContent({ saveSettings });
    const newFormat = '000,000';

    const input = getByLabelText('Integer');
    await user.clear(input);
    await user.type(input, newFormat);

    jest.runOnlyPendingTimers();

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultIntegerFormatOptions: { defaultFormatString: newFormat },
      })
    );

    unmount();
  });

  it('resets to default', async () => {
    const user = userEvent.setup({ delay: null });
    const saveSettings = jest.fn();
    const defaultFormatOptions = {
      defaultFormatString: DEFAULT_INTEGER_STRING,
    };
    renderSectionContent({
      saveSettings,
      defaultIntegerFormatOptions: {
        defaultFormatString: '000',
      },
      defaults: makeDefaults({
        defaultIntegerFormatOptions: defaultFormatOptions,
      }),
    });

    const element = screen.getByTestId('btn-reset-integer');
    expect(element).not.toBeNull();
    assertNotNull(element);
    await user.click(element);

    jest.runOnlyPendingTimers();

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultIntegerFormatOptions: defaultFormatOptions,
      })
    );
  });
});
