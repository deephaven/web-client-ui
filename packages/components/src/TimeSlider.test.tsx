import React from 'react';
import { render } from '@testing-library/react';
import TimeSlider from './TimeSlider';

function makeTimeSlider({
  startTime = 0,
  endTime = 24 * 60 * 60 - 1,
  onChange = jest.fn(),
} = {}) {
  return render(
    <TimeSlider startTime={startTime} endTime={endTime} onChange={onChange} />
  );
}

it('mounts and unmounts properly', () => {
  makeTimeSlider();
});
