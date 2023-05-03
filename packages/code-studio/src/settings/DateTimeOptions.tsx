import React, { ReactElement } from 'react';
import {
  Formatter,
  DateTimeColumnFormatter,
  TableUtils,
} from '@deephaven/jsapi-utils';
import { dh as DhType } from '@deephaven/jsapi-types';

interface DateTimeOptionProps {
  dh: DhType;
  timestamp: Date;
  timeZone: string;
  showTimeZone: boolean;
  showTSeparator: boolean;
  isGlobalOptions: boolean;
  legacyGlobalFormat?: string;
}

export default function DateTimeOptions(
  props: DateTimeOptionProps
): ReactElement {
  const {
    dh,
    timestamp,
    timeZone,
    showTimeZone,
    showTSeparator,
    isGlobalOptions,
    legacyGlobalFormat,
  } = props;

  const formatter = new Formatter(dh, [], {
    timeZone,
    showTimeZone,
    showTSeparator,
  });
  const formats = isGlobalOptions
    ? DateTimeColumnFormatter.getGlobalFormats(showTimeZone, showTSeparator)
    : DateTimeColumnFormatter.getFormats(showTimeZone, showTSeparator);

  if (legacyGlobalFormat != null && !formats.includes(legacyGlobalFormat)) {
    formats.unshift(legacyGlobalFormat);
  }

  return (
    <>
      {formats.map(formatString => {
        const format = DateTimeColumnFormatter.makeFormat(
          '',
          formatString,
          DateTimeColumnFormatter.TYPE_GLOBAL
        );
        return (
          <option
            value={formatString}
            key={formatString}
            data-testid="time-format"
          >
            {formatter.getFormattedString(
              timestamp,
              TableUtils.dataType.DATETIME,
              '',
              format
            )}
          </option>
        );
      })}
    </>
  );
}
