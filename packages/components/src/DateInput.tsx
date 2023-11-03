import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import Log from '@deephaven/log';
import MaskedInput, { SelectionSegment } from './MaskedInput';
import { getNextSegmentValue } from './DateInputUtils';

const log = Log.module('DateInput');

const DATE_PATTERN = '[12][0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])';
const EXAMPLES = ['2000-01-01', '2022-12-31'];
const DATE_FORMAT = 'YYYY-MM-DD';

type DateInputProps = {
  className?: string;
  onChange: (date: string) => void; // Remove the question mark to make date non-optional
  defaultValue?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  'data-testid'?: string;
};

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (props: DateInputProps, ref) => {
    const {
      className = '',
      onChange = () => undefined, // Provide a default value for onChange
      defaultValue = '',
      onFocus = () => undefined,
      onBlur = () => undefined,
      'data-testid': dataTestId,
    } = props;
    const [value, setValue] = useState(defaultValue);
    const [selection, setSelection] = useState<SelectionSegment>();

    const handleChange = useCallback(
      (newValue: string): void => {
        log.debug('handleChange', newValue);
        setValue(newValue);
        onChange(newValue);
      },
      [onChange]
    );

    return (
      <div className="d-flex flex-row align-items-center">
        <MaskedInput
          ref={ref}
          className={classNames(className)}
          example={EXAMPLES}
          getNextSegmentValue={getNextSegmentValue}
          onChange={handleChange}
          onSelect={setSelection}
          pattern={DATE_PATTERN}
          placeholder={DATE_FORMAT}
          selection={selection}
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          data-testid={dataTestId}
        />
      </div>
    );
  }
);
DateInput.displayName = 'DateInput';

export default DateInput;
