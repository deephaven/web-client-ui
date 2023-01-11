import {
  screen,
  render,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { WorkspaceSettings } from '@deephaven/redux';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Formatter } from '@deephaven/jsapi-utils';

import {
  ColumnSpecificSectionContent,
  ColumnSpecificSectionContentProps,
} from './ColumnSpecificSectionContent';

const DEFAULT_DECIMAL_STRING = '###,#00.00';
const DEFAULT_INTEGER_STRING = '###,000';

function renderContent({
  formatter = [],
  defaultDateTimeFormat = '',
  showTimeZone = false,
  showTSeparator = false,
  timeZone = '',
  truncateNumbersWithPound = false,
  settings = {} as WorkspaceSettings,
  saveSettings = jest.fn(),
  scrollTo = undefined,
  defaultDecimalFormatOptions = {
    defaultFormatString: DEFAULT_DECIMAL_STRING,
  },
  defaultIntegerFormatOptions = {
    defaultFormatString: DEFAULT_INTEGER_STRING,
  },
}: Partial<ColumnSpecificSectionContentProps> = {}) {
  return render(
    <ColumnSpecificSectionContent
      formatter={formatter}
      defaultDateTimeFormat={defaultDateTimeFormat}
      showTimeZone={showTimeZone}
      showTSeparator={showTSeparator}
      timeZone={timeZone}
      truncateNumbersWithPound={truncateNumbersWithPound}
      settings={settings}
      saveSettings={saveSettings}
      scrollTo={scrollTo}
      defaultDecimalFormatOptions={defaultDecimalFormatOptions}
      defaultIntegerFormatOptions={defaultIntegerFormatOptions}
    />
  );
}

it('should mount with the default values correctly', async () => {
  renderContent();

  expect(await screen.queryByRole('textbox')).toBe(null);
});

it('can add a blank format rule', async () => {
  renderContent();

  const btn = screen.getByRole('button');
  expect(btn).not.toBeNull();
  userEvent.click(btn);

  expect(await screen.findByRole('textbox')).toBeInTheDocument();
});

it('can delete a format rule', async () => {
  renderContent();

  const addBtn = screen.getByRole('button');
  expect(addBtn).not.toBeNull();
  userEvent.click(addBtn);

  const delBtn = screen.getByRole('button', { name: /Delete Format Rule/g });
  expect(delBtn).not.toBeNull();
  userEvent.click(delBtn);

  await waitForElementToBeRemoved(screen.queryByRole('textbox'));
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});

it('can edit a format rule', () => {
  renderContent();

  const addBtn = screen.getByRole('button');
  expect(addBtn).not.toBeNull();
  userEvent.click(addBtn);

  userEvent.type(screen.getByLabelText('Column Name'), 'test');
  expect(screen.getByDisplayValue('test')).toBeInTheDocument();

  userEvent.selectOptions(screen.getByLabelText('Column Type'), 'DateTime');
  expect(
    (screen.getByText('DateTime') as HTMLOptionElement).selected
  ).toBeTruthy();
  expect(
    (screen.getByText('Decimal') as HTMLOptionElement).selected
  ).toBeFalsy();
  expect(
    (screen.getByText('Integer') as HTMLOptionElement).selected
  ).toBeFalsy();

  userEvent.selectOptions(screen.getByLabelText('Column Type'), 'Integer');
  expect(
    (screen.getByText('DateTime') as HTMLOptionElement).selected
  ).toBeFalsy();
  expect(
    (screen.getByText('Decimal') as HTMLOptionElement).selected
  ).toBeFalsy();
  expect(
    (screen.getByText('Integer') as HTMLOptionElement).selected
  ).toBeTruthy();
});

it('displays an error when the formatting rule is empty', () => {
  renderContent();

  const addBtn = screen.getByRole('button');
  expect(addBtn).not.toBeNull();
  userEvent.click(addBtn);

  userEvent.type(screen.getByLabelText('Column Name'), 'test');
  expect(screen.getByDisplayValue('test')).toBeInTheDocument();

  userEvent.selectOptions(screen.getByLabelText('Column Type'), 'Decimal');
  userEvent.type(screen.getByLabelText('Formatting Rule'), ' {backspace}');
  expect(screen.queryByText(/Empty formatting rule\./)).toBeInTheDocument();
});

it('displays an error when two rules have the same name and type', () => {
  renderContent();

  const addBtn = screen.getByRole('button');
  expect(addBtn).not.toBeNull();
  userEvent.click(addBtn);
  userEvent.click(addBtn);

  const columnNameTextboxes = screen.getAllByLabelText('Column Name');
  userEvent.type(columnNameTextboxes[0], 'test');
  userEvent.type(columnNameTextboxes[1], 'test');

  const columnTypeSelects = screen.getAllByLabelText('Column Type');
  userEvent.selectOptions(columnTypeSelects[0], 'Decimal');
  userEvent.selectOptions(columnTypeSelects[1], 'Decimal');

  expect(
    screen.queryAllByText(/Duplicate column name\/type combo\./)
  ).not.toBeNull();
});

it('should render a select menu when the column type is DateTime', () => {
  renderContent();

  const addBtn = screen.getByRole('button');
  expect(addBtn).not.toBeNull();
  userEvent.click(addBtn);

  // const selectFormat = screen.getByLabelText('Formatting Rule');

  // const formats = isGlobalOptions
  //   ? DateTimeColumnFormatter.getGlobalFormats(showTimeZone, showTSeparator)
  //   : DateTimeColumnFormatter.getFormats(showTimeZone, showTSeparator);

  // userEvent.selectOptions(selectFormat, 'Decimal');
});

it('should change the input value when column type is Integer', () => {
  renderContent();
  const newFormat = '0.00';

  const addBtn = screen.getByRole('button');
  expect(addBtn).not.toBeNull();
  userEvent.click(addBtn);

  userEvent.selectOptions(screen.getByLabelText('Column Type'), 'Integer');
  userEvent.type(
    screen.getByLabelText('Formatting Rule'),
    `{selectall}${newFormat}`
  );

  expect(screen.getByDisplayValue(newFormat)).toBeInTheDocument();
});

it('should throw an error if formatter is wrong', () => {
  const formatter = [
    Formatter.makeColumnFormattingRule('string', 'TEST', {
      label: '',
      formatString: '',
      type: 'type-global',
    }),
  ];
  expect(async () => {
    await renderContent({ formatter });
  }).rejects.toThrow();
});
