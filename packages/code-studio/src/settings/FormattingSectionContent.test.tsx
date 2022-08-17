import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
} = {}) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return render(
    <FormattingSectionContent
      settings={settings as WorkspaceSettings}
      formatter={formatter}
      showTimeZone={showTimeZone}
      showTSeparator={showTSeparator}
      timeZone={timeZone}
      defaultDateTimeFormat={defaultDateTimeFormat}
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

  it('updates settings when value is changed', () => {
    const saveSettings = jest.fn();
    const { getByLabelText, unmount } = renderSectionContent({ saveSettings });
    const newFormat = '00.0';
    // {selectall} to overwrite existing input value, otherwise appends
    userEvent.type(getByLabelText('Decimal'), `{selectall}${newFormat}`);

    jest.runOnlyPendingTimers();

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultDecimalFormatOptions: { defaultFormatString: newFormat },
      })
    );

    unmount();
  });

  it('resets to default', () => {
    const saveSettings = jest.fn();
    const defaultFormatOptions = {
      defaultFormatString: DEFAULT_DECIMAL_STRING,
    };
    const { container } = renderSectionContent({
      saveSettings,
      defaultDecimalFormatOptions: {
        defaultFormatString: '000',
      },
      defaults: makeDefaults({
        defaultDecimalFormatOptions: defaultFormatOptions,
      }),
    });

    const element = container.querySelector('.btn-reset-decimal');
    expect(element).not.toBeNull();
    assertNotNull(element);
    userEvent.click(element);

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

  it('updates settings when value is changed', () => {
    const saveSettings = jest.fn();
    const { getByLabelText, unmount } = renderSectionContent({ saveSettings });
    const newFormat = '000,000';

    userEvent.type(getByLabelText('Integer'), `{selectall}${newFormat}`);

    jest.runOnlyPendingTimers();

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultIntegerFormatOptions: { defaultFormatString: newFormat },
      })
    );

    unmount();
  });

  it('resets to default', () => {
    const saveSettings = jest.fn();
    const defaultFormatOptions = {
      defaultFormatString: DEFAULT_INTEGER_STRING,
    };
    const { container } = renderSectionContent({
      saveSettings,
      defaultIntegerFormatOptions: {
        defaultFormatString: '000',
      },
      defaults: makeDefaults({
        defaultIntegerFormatOptions: defaultFormatOptions,
      }),
    });

    const element = container.querySelector('.btn-reset-integer');
    expect(element).not.toBeNull();
    assertNotNull(element);
    userEvent.click(element);

    jest.runOnlyPendingTimers();

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultIntegerFormatOptions: defaultFormatOptions,
      })
    );
  });
});
