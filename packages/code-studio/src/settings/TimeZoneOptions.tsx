import React from 'react';
import { TimeUtils } from '@deephaven/utils';

export default function TimeZoneOptions(): JSX.Element {
  return (
    <>
      {TimeUtils.TIME_ZONES.map(timeZone => {
        const { label, value } = timeZone;
        return (
          <option value={value} key={value}>
            {label}
          </option>
        );
      })}
    </>
  );
}
