import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Log from '@deephaven/log';
import { TimeUtils } from '@deephaven/utils';
import MaskedInput from './MaskedInput';

const log = Log.module('TimeInput');

const TIME_PATTERN = '([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]';
const EXAMPLES = ['00:00:00', '12:34:56', '23:59:59'];

// Forward ref causes a false positive for display-name in eslint:
// https://github.com/yannickcr/eslint-plugin-react/issues/2269
// eslint-disable-next-line react/display-name
const TimeInput = React.forwardRef((props, ref) => {
  const {
    allowValueWrapping,
    className,
    onChange,
    value: propsValue,
    onFocus,
    onBlur,
  } = props;
  const [value, setValue] = useState(TimeUtils.formatTime(propsValue));
  const [selection, setSelection] = useState(null);
  useEffect(() => {
    setValue(TimeUtils.formatTime(propsValue));
  }, [propsValue]);

  function getNextSegmentValue(range, delta, segmentValue) {
    // Delta is backward because negative Y is up
    const maxValue = range.selectionStart === 0 ? 24 : 60;
    let newSegmentValue = parseInt(segmentValue, 10) - delta;
    if (Number.isNaN(newSegmentValue)) {
      newSegmentValue = 0;
    } else if (allowValueWrapping) {
      // Add max value and re-mod so we don't get negative values after mod
      newSegmentValue = ((newSegmentValue % maxValue) + maxValue) % maxValue;
    } else {
      newSegmentValue = Math.min(Math.max(0, newSegmentValue), maxValue - 1);
    }
    return `${newSegmentValue}`.padStart(2, '0');
  }

  function handleChange(newValue) {
    log.debug('handleChange', newValue);
    setValue(newValue);

    // Only send a change if the value is actually valid
    if (new RegExp(TIME_PATTERN).test(newValue)) {
      onChange(TimeUtils.parseTime(newValue));
    }
  }

  function handleSelect(newSelection) {
    setSelection(newSelection);
  }

  return (
    <MaskedInput
      ref={ref}
      className={className}
      example={EXAMPLES}
      getNextSegmentValue={getNextSegmentValue}
      onChange={handleChange}
      onSelect={handleSelect}
      pattern={TIME_PATTERN}
      selection={selection}
      value={value}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
});

TimeInput.propTypes = {
  allowValueWrapping: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.number,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

TimeInput.defaultProps = {
  allowValueWrapping: true,
  className: '',
  onChange: () => {},
  value: 0,
  onFocus: () => {},
  onBlur: () => {},
};

export default TimeInput;
