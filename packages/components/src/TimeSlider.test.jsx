import React from 'react';
import { mount } from 'enzyme';
import TimeSlider from './TimeSlider';

function makeTimeSlider({
  startTime = 0,
  endTime = 24 * 60 * 60 - 1,
  onChange = jest.fn(),
} = {}) {
  return mount(
    <TimeSlider startTime={startTime} endTime={endTime} onChange={onChange} />
  );
}

it('mounts and unmounts properly', () => {
  const timeSlider = makeTimeSlider();
  timeSlider.unmount();
});
