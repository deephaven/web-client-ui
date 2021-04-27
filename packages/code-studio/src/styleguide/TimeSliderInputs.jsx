import React, { PureComponent } from 'react';
import { TimeUtils } from '@deephaven/utils';
import { TimeSlider } from '@deephaven/components';

class TimeSliderInputs extends PureComponent {
  constructor(props) {
    super(props);

    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.state = {
      startTime: 24 * 60 * 60 * 0.25, // example start and end times
      endTime: 24 * 60 * 60 * 0.75, // example start and end times
    };
  }

  handleSliderChange(values) {
    const { startTime, endTime } = values;
    this.setState({ startTime });
    this.setState({ endTime });
  }

  render() {
    const { startTime, endTime } = this.state;
    return (
      <div className="style-guide-inputs">
        <h2 className="ui-title">Time Slider</h2>
        <TimeSlider
          startTime={startTime}
          endTime={endTime}
          onChange={this.handleSliderChange}
        />
        <p>StartTime: {TimeUtils.formatTime(startTime)}</p>
        <p>EndTime: {TimeUtils.formatTime(endTime)}</p>
      </div>
    );
  }
}

export default TimeSliderInputs;
