import React from 'react';
import { mount } from 'enzyme';
import { FormattingSectionContent } from './FormattingSectionContent';

function mountSectionContent(
  props = {
    settings: {},
    formatter: [],
    showTimeZone: true,
    showTSeparator: false,
    timeZone: '',
    defaultDateTimeFormat: '',
    saveSettings: jest.fn(),
    scrollTo: jest.fn(),
  }
) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return mount(<FormattingSectionContent {...props} />);
}

it('should mount and unmount without errors', () => {
  const wrapper = mountSectionContent();
  wrapper.unmount();
});
