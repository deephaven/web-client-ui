import React from 'react';
import { TimeSlider as TimeSliderComp } from '@deephaven/components';

export default {
  title: 'Input',
};

const Template = args => <TimeSliderComp {...args} />;

const startTime = 24 * 60 * 60 * 0.25;
const endTime = 24 * 60 * 60 * 0.75;
const onChange = () => {};

export const TimeSlider = Template.bind({});
TimeSlider.args = {
  startTime,
  endTime,
  onChange,
};
