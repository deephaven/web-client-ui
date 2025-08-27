import React from 'react';
import { render } from '@testing-library/react';
import ConsoleHistoryItemTooltip, {
  getTimeString,
} from './ConsoleHistoryItemTooltip';

// simple conversions to seconds
const MILLISECONDS = 1000;
const NANOSECONDS = 1e9;

// combined conversions to minutes and hours for convenience
const NANOMINUTES = 60 * NANOSECONDS;
const NANOHOURS = 60 * NANOMINUTES;
const MILLIMINUTES = 60 * MILLISECONDS;
const MILLIHOURS = 60 * MILLIMINUTES;

describe('ConsoleHistoryItemTooltip', () => {
  const item = {
    startTime: 0,
    endTime: 2 * NANOSECONDS,
    serverStartTime: 0,
    serverEndTime: NANOSECONDS,
  };

  const onOpenChange = jest.fn();

  it('renders the formatted type name', () => {
    const { getByText } = render(
      <ConsoleHistoryItemTooltip item={item} onOpenChange={onOpenChange} />
    );
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
    expect(getTimeString(0, 59.99 * NANOSECONDS, 'ns')).toBe('59.99s');
    expect(getTimeString(59 * NANOSECONDS, 60 * NANOSECONDS, 'ns')).toBe(
      '1.00s'
    );
  });

  it('returns correct minutes for nano conversion', () => {
    expect(getTimeString(0, 59.99 * NANOMINUTES, 'ns')).toBe('59.99m');
    expect(getTimeString(59 * NANOMINUTES, 60 * NANOMINUTES, 'ns')).toBe(
      '1.00m'
    );
  });

  it('returns correct hours for nano conversion', () => {
    expect(getTimeString(0, 59.99 * NANOHOURS, 'ns')).toBe('59.99h');
    expect(getTimeString(59 * NANOHOURS, 60 * NANOHOURS, 'ns')).toBe('1.00h');
  });

  it('returns correct seconds for milli conversion', () => {
    expect(getTimeString(0, 59.99 * MILLISECONDS)).toBe('59.99s');
    expect(getTimeString(59 * MILLISECONDS, 60 * MILLISECONDS)).toBe('1.00s');
  });

  it('returns correct minutes for milli conversion', () => {
    expect(getTimeString(0, 59.99 * MILLIMINUTES)).toBe('59.99m');
    expect(getTimeString(59 * MILLIMINUTES, 60 * MILLIMINUTES)).toBe('1.00m');
  });

  it('returns correct hours for milli conversion', () => {
    expect(getTimeString(0, 59.99 * MILLIHOURS)).toBe('59.99h');
    expect(getTimeString(59 * MILLIHOURS, 60 * MILLIHOURS)).toBe('1.00h');
  });
});
