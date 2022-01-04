import React from 'react';
import { mount } from 'enzyme';
import { FormattingSectionContent } from './FormattingSectionContent';

const DEFAULT_DECIMAL_STRING = '###,#00.00';
const DEFAULT_INTEGER_STRING = '###,000';

function mountSectionContent({
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
} = {}) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return mount(
    <FormattingSectionContent
      settings={settings}
      formatter={formatter}
      showTimeZone={showTimeZone}
      showTSeparator={showTSeparator}
      timeZone={timeZone}
      defaultDateTimeFormat={defaultDateTimeFormat}
      saveSettings={saveSettings}
      scrollTo={scrollTo}
      defaultDecimalFormatOptions={defaultDecimalFormatOptions}
      defaultIntegerFormatOptions={defaultIntegerFormatOptions}
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
  const wrapper = mountSectionContent();
  wrapper.unmount();
});

describe('default decimal formatting', () => {
  it('shows the currently set default', () => {
    const wrapper = mountSectionContent();
    expect(wrapper.find('.default-decimal-format-input').prop('value')).toEqual(
      DEFAULT_DECIMAL_STRING
    );
    wrapper.unmount();
  });

  it('updates settings when value is changed', () => {
    const saveSettings = jest.fn();
    const wrapper = mountSectionContent({ saveSettings });
    const newFormat = '00.0';
    wrapper
      .find('.default-decimal-format-input')
      .simulate('change', { target: { value: newFormat } });

    jest.runOnlyPendingTimers();

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultDecimalFormatOptions: { defaultFormatString: newFormat },
      })
    );

    wrapper.unmount();
  });
});

describe('default integer formatting', () => {
  it('shows the currently set default', () => {
    const wrapper = mountSectionContent();
    expect(wrapper.find('.default-integer-format-input').prop('value')).toEqual(
      DEFAULT_INTEGER_STRING
    );
    wrapper.unmount();
  });

  it('updates settings when value is changed', () => {
    const saveSettings = jest.fn();
    const wrapper = mountSectionContent({ saveSettings });
    const newFormat = '000,000';
    wrapper
      .find('.default-integer-format-input')
      .simulate('change', { target: { value: newFormat } });

    jest.runOnlyPendingTimers();

    expect(saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultIntegerFormatOptions: { defaultFormatString: newFormat },
      })
    );

    wrapper.unmount();
  });
});
