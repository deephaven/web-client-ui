import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
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
  updateSettings = jest.fn(),
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
    <ApiContext.Provider value={dh}>
      <FormattingSectionContent
        dh={dh}
        settings={settings as WorkspaceSettings}
        formatter={formatter}
        showTimeZone={showTimeZone}
        showTSeparator={showTSeparator}
        timeZone={timeZone}
        defaultDateTimeFormat={defaultDateTimeFormat}
        truncateNumbersWithPound={truncateNumbersWithPound}
        updateSettings={updateSettings}
        scrollTo={scrollTo}
        defaultDecimalFormatOptions={defaultDecimalFormatOptions}
        defaultIntegerFormatOptions={defaultIntegerFormatOptions}
        defaults={defaults}
      />
    </ApiContext.Provider>
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
    const updateSettings = jest.fn();
    const { getByLabelText, unmount } = renderSectionContent({
      updateSettings,
    });
    const newFormat = '00.0';
    const input = getByLabelText('Decimal');
    await user.clear(input);
    await user.type(input, newFormat);

    jest.runOnlyPendingTimers();

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultDecimalFormatOptions: { defaultFormatString: newFormat },
      })
    );

    unmount();
  });

  it('resets to default', async () => {
    const user = userEvent.setup({ delay: null });
    const updateSettings = jest.fn();
    const defaultFormatOptions = {
      defaultFormatString: DEFAULT_DECIMAL_STRING,
    };
    renderSectionContent({
      updateSettings,
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

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultDecimalFormatOptions: undefined,
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
    const updateSettings = jest.fn();
    const { getByLabelText, unmount } = renderSectionContent({
      updateSettings,
    });
    const newFormat = '000,000';

    const input = getByLabelText('Integer');
    await user.clear(input);
    await user.type(input, newFormat);

    jest.runOnlyPendingTimers();

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultIntegerFormatOptions: { defaultFormatString: newFormat },
      })
    );

    unmount();
  });

  it('resets to default', async () => {
    const user = userEvent.setup({ delay: null });
    const updateSettings = jest.fn();
    const defaultFormatOptions = {
      defaultFormatString: DEFAULT_INTEGER_STRING,
    };
    renderSectionContent({
      updateSettings,
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

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultIntegerFormatOptions: undefined,
      })
    );
  });
});
