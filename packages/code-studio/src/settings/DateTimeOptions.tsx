import React, { ReactElement, useMemo } from 'react';
import {
  Formatter,
  DateTimeColumnFormatter,
  TableUtils,
} from '@deephaven/jsapi-utils';
import { useApi } from '@deephaven/jsapi-bootstrap';

interface DateTimeOptionProps {
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
    timestamp,
    timeZone,
    showTimeZone,
    showTSeparator,
    isGlobalOptions,
    legacyGlobalFormat,
  } = props;

  const dh = useApi();

  const formatter = useMemo(
    () =>
      new Formatter(dh, [], {
        timeZone,
        showTimeZone,
        showTSeparator,
      }),
    [dh, showTimeZone, showTSeparator, timeZone]
  );
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
