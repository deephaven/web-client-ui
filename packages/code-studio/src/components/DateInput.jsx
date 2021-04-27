import React, { useState } from 'react';
import PropTypes from 'prop-types';
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import { MaskedInput } from '@deephaven/components';

const log = Log.module('DateInput');

// This could be more restrictive and restrict days to the number of days in the month...
// But then gotta take leap year into account and everything.
const DATE_PATTERN = '[12][0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])';
// Put zero width spaces in the nanosecond part of the date to allow jumping between segments
const TIME_PATTERN =
  '([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]\\.[0-9]{3}\u200B[0-9]{3}\u200B[0-9]{3}';
const FULL_DATE_PATTERN = `${DATE_PATTERN} ${TIME_PATTERN}`;
const DH_FORMAT_PATTERN = 'yyyy-MM-dd HH:mm:ss.SSSSSSSSS';
const DEFAULT_VALUE_STRING = '2019-01-01 00:00:00.000\u200B000\u200B000';
const EXAMPLES = [DEFAULT_VALUE_STRING];

const parseDateString = dateString =>
  dh.i18n.DateTimeFormat.parse(
    DH_FORMAT_PATTERN,
    dateString.replace(/\u200B/g, '')
  );

const formatDateAsString = date => {
  const formattedString = dh.i18n.DateTimeFormat.format(
    DH_FORMAT_PATTERN,
    date
  );

  // Add the zero width spaces to separate milli/micro/nano
  return `${formattedString.substring(0, 23)}\u200B${formattedString.substring(
    23,
    26
  )}\u200B${formattedString.substring(26)}`;
};

const DateInput = props => {
  const { className, defaultValue, onChange } = props;
  const [value, setValue] = useState(formatDateAsString(defaultValue));
  const [selection, setSelection] = useState(null);

  function getNextNumberSegmentValue(
    delta,
    segmentValue,
    lowerBound,
    upperBound,
    length
  ) {
    const modValue = upperBound - lowerBound + 1;
    const newSegmentValue =
      ((((parseInt(segmentValue, 10) - delta - lowerBound) % modValue) +
        modValue) %
        modValue) +
      lowerBound;
    return `${newSegmentValue}`.padStart(length, '0');
  }

  function getNextSegmentValue(range, delta, segmentValue) {
    const { selectionStart } = range;
    if (selectionStart === 0) {
      return getNextNumberSegmentValue(delta, segmentValue, 1900, 2099, 4);
    }
    if (selectionStart === 5) {
      return getNextNumberSegmentValue(delta, segmentValue, 1, 12, 2);
    }
    if (selectionStart === 8) {
      return getNextNumberSegmentValue(delta, segmentValue, 1, 31, 2);
    }
    if (selectionStart === 11) {
      // Hours input
      return getNextNumberSegmentValue(delta, segmentValue, 0, 23, 2);
    }
    if (selectionStart === 17 || selectionStart === 14) {
      // Minutes/seconds input
      return getNextNumberSegmentValue(delta, segmentValue, 0, 59, 2);
    }
    if (
      selectionStart === 20 ||
      selectionStart === 24 ||
      selectionStart === 28
    ) {
      // Milli, micro, and nanosecond input
      return getNextNumberSegmentValue(delta, segmentValue, 0, 999, 3);
    }

    return segmentValue;
  }

  function handleChange(newValue) {
    log.debug('handleChange', newValue);
    setValue(newValue);
    onChange(newValue);
  }

  function handleSelect(newSelection) {
    setSelection(newSelection);
  }

  return (
    <MaskedInput
      className={className}
      pattern={FULL_DATE_PATTERN}
      example={EXAMPLES}
      getNextSegmentValue={getNextSegmentValue}
      value={value}
      onChange={handleChange}
      onSelect={handleSelect}
      selection={selection}
    />
  );
};

DateInput.propTypes = {
  className: PropTypes.string,
  defaultValue: PropTypes.shape({}),
  onChange: PropTypes.func,
};

DateInput.defaultProps = {
  className: '',
  defaultValue: parseDateString(DEFAULT_VALUE_STRING),
  onChange: () => {},
};

export default DateInput;
