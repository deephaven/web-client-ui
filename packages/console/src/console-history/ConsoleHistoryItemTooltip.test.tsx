import React from 'react';
import { render } from '@testing-library/react';
import ConsoleHistoryItemTooltip from './ConsoleHistoryItemTooltip';
import { TimeUtils } from '@deephaven/utils';

describe('ConsoleHistoryItemTooltip', () => {
  const item = {
    startTime: 0,
    endTime: 2 * TimeUtils.MILLIS_PER_SECOND,
    serverStartTime: 0,
    serverEndTime: TimeUtils.NANOS_PER_SECOND,
  };

  it('renders the formatted type name', () => {
    const { getByText } = render(<ConsoleHistoryItemTooltip item={item} />);
    expect(getByText('Elapsed time')).toBeInTheDocument();
    expect(getByText('2.00s')).toBeInTheDocument();
    expect(getByText('Server query time')).toBeInTheDocument();
    expect(getByText('1.00s')).toBeInTheDocument();
  });
});
