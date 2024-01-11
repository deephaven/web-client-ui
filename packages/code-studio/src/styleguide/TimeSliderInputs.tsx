/* eslint-disable react/jsx-props-no-spreading */
import React, { PureComponent } from 'react';
import { TimeUtils } from '@deephaven/utils';
import { TimeSlider } from '@deephaven/components';
import { sampleSectionIdAndClasses } from './utils';

interface TimeSliderInputsState {
  initialStartTime: number;
  initialEndTime: number;
  startTime: number;
  endTime: number;
}

class TimeSliderInputs extends PureComponent<
  Record<string, never>,
  TimeSliderInputsState
> {
  constructor(props: Record<string, never>) {
    super(props);

    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.state = {
      initialStartTime: 24 * 60 * 60 * 0.25,
      initialEndTime: 24 * 60 * 60 * 0.75,
      startTime: 24 * 60 * 60 * 0.25, // example start and end times
      endTime: 24 * 60 * 60 * 0.75, // example start and end times
    };
  }

  handleSliderChange(values: { startTime: number; endTime: number }): void {
    const { startTime, endTime } = values;
    this.setState({ startTime });
    this.setState({ endTime });
  }

  render(): React.ReactElement {
    const { startTime, endTime } = this.state;
    const isStartModified = startTime !== this.state.initialStartTime;
    const isEndModified = endTime !== this.state.initialEndTime;
    return (
      <div
        {...sampleSectionIdAndClasses('time-slider-inputs', [
          'style-guide-inputs',
        ])}
      >
        <h2 className="ui-title">Time Slider</h2>
        <TimeSlider
          startTime={startTime}
          endTime={endTime}
          isStartModified={isStartModified}
          isEndModified={isEndModified}
          onChange={this.handleSliderChange}
        />
        <p style={isStartModified ? { color: 'var(--dh-color-modified)' } : {}}>
          StartTime: {TimeUtils.formatTime(startTime)}
        </p>
        <p style={isEndModified ? { color: 'var(--dh-color-modified)' } : {}}>
          EndTime: {TimeUtils.formatTime(endTime)}
        </p>
      </div>
    );
  }
}

export default TimeSliderInputs;
