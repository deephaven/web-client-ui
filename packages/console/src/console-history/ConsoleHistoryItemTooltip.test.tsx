import React from 'react';
import { render } from '@testing-library/react';
import ConsoleHistoryItemTooltip, {
  getTimeString,
} from './ConsoleHistoryItemTooltip';

// simple conversions to seconds
const MILLIS_PER_SECOND = 1000;
const NANOS_PER_SECOND = 1e9;

const NANOS_PER_MIN = 60 * NANOS_PER_SECOND;
const NANOS_PER_HOUR = 60 * NANOS_PER_MIN;
const MILLIS_PER_MIN = 60 * MILLIS_PER_SECOND;
const MILLIS_PER_HOUR = 60 * MILLIS_PER_MIN;

describe('ConsoleHistoryItemTooltip', () => {
  const item = {
    startTime: 0,
    endTime: 2 * MILLIS_PER_SECOND,
    serverStartTime: 0,
    serverEndTime: NANOS_PER_SECOND,
  };

  it('renders the formatted type name', () => {
    const { getByText } = render(<ConsoleHistoryItemTooltip item={item} />);
    expect(getByText('Elapsed time')).toBeInTheDocument();
    expect(getByText('2.00s')).toBeInTheDocument();
    expect(getByText('Server query time')).toBeInTheDocument();
    expect(getByText('1.00s')).toBeInTheDocument();
  });
});

describe('getTimeString converts as expected', () => {
  it('returns null for invalid inputs', () => {
    expect(getTimeString(undefined, 1000)).toBeNull();
    expect(getTimeString(1000, undefined)).toBeNull();
    expect(getTimeString(1000, '')).toBeNull();
    expect(getTimeString(1000, 0)).toBeNull();
    expect(getTimeString(1000, 1000, 'invalid')).toBeNull();
  });

  it('returns correct seconds for nano conversion', () => {
    expect(getTimeString(0, 59.99 * NANOS_PER_SECOND, 'ns')).toBe('59.99s');
    expect(
      getTimeString(59 * NANOS_PER_SECOND, 60 * NANOS_PER_SECOND, 'ns')
    ).toBe('1.00s');
  });

  it('returns correct minutes for nano conversion', () => {
    expect(getTimeString(0, 59.99 * NANOS_PER_MIN, 'ns')).toBe('59.99m');
    expect(getTimeString(59 * NANOS_PER_MIN, 60 * NANOS_PER_MIN, 'ns')).toBe(
      '1.00m'
    );
  });

  it('returns correct hours for nano conversion', () => {
    expect(getTimeString(0, 59.99 * NANOS_PER_HOUR, 'ns')).toBe('59.99h');
    expect(getTimeString(59 * NANOS_PER_HOUR, 60 * NANOS_PER_HOUR, 'ns')).toBe(
      '1.00h'
    );
  });

  it('returns correct seconds for milli conversion', () => {
    expect(getTimeString(0, 59.99 * MILLIS_PER_SECOND)).toBe('59.99s');
    expect(getTimeString(59 * MILLIS_PER_SECOND, 60 * MILLIS_PER_SECOND)).toBe(
      '1.00s'
    );
  });

  it('returns correct minutes for milli conversion', () => {
    expect(getTimeString(0, 59.99 * MILLIS_PER_MIN)).toBe('59.99m');
    expect(getTimeString(59 * MILLIS_PER_MIN, 60 * MILLIS_PER_MIN)).toBe(
      '1.00m'
    );
  });

  it('returns correct hours for milli conversion', () => {
    expect(getTimeString(0, 59.99 * MILLIS_PER_HOUR)).toBe('59.99h');
    expect(getTimeString(59 * MILLIS_PER_HOUR, 60 * MILLIS_PER_HOUR)).toBe(
      '1.00h'
    );
  });
});
