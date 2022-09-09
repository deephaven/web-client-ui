import { DateInput, DateTimeInput } from '@deephaven/components';
import React from 'react';

const DateTimeInputs = (): React.ReactElement => (
  <div className="style-guide-inputs">
    <h2 className="ui-title">DateTime Inputs</h2>
    <DateTimeInput optional />
    <DateTimeInput />
    <h2 className="ui-title">Date Inputs</h2>
    <DateInput optional />
    <DateInput />
  </div>
);

export default DateTimeInputs;
