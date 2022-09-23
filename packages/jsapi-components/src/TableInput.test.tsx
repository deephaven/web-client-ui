import React from 'react';
import { render } from '@testing-library/react';
import { DateUtils } from '@deephaven/jsapi-utils';
import dh from '@deephaven/jsapi-shim';
import TableInput from './TableInput';

jest.useFakeTimers();

const DEFAULT_SETTINGS = {
  timeZone: 'America/New_York',
  defaultDateTimeFormat: DateUtils.FULL_DATE_FORMAT,
  showTimeZone: false,
  showTSeparator: true,
  formatter: [],
  truncateNumbersWithPound: false,
};

function makeTable() {
  const columns = [new dh.Column({ index: 0, name: '0' })];
  return new dh.Table({ columns });
}

function makeTableInput({
  columnName = '0',
  settings = DEFAULT_SETTINGS,
  table = makeTable(),
} = {}) {
  return render(
    <TableInput
      columnName={columnName}
      settings={settings}
      defaultValue={[]}
      onChange={() => undefined}
      table={table}
    />
  );
}

describe('TableInput', () => {
  it('mounts and unmounts with a table properly', () => {
    const tableWrapper = makeTableInput();
    tableWrapper.unmount();
  });

  it('mounts and unmounts with an unresolved promise properly', async () => {
    const tablePromiseWrapper = makeTableInput({
      table: new Promise(() => undefined),
    });
    tablePromiseWrapper.unmount();
  });
});
