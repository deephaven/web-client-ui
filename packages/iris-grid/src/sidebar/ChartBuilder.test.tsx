import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dh from '@deephaven/jsapi-shim';
import ChartBuilder from './ChartBuilder';
import IrisGridTestUtils from '../IrisGridTestUtils';

const COLUMN_NAMES = ['A', 'B', 'C', 'D'];

const irisGridTestUtils = new IrisGridTestUtils(dh);

function makeChartBuilderWrapper({
  onChange = () => null,
  onSubmit = () => null,
  model = irisGridTestUtils.makeModel(
    irisGridTestUtils.makeTable({
      columns: COLUMN_NAMES.map(name => irisGridTestUtils.makeColumn(name)),
    })
  ),
} = {}) {
  return render(
    <ChartBuilder
      onChange={onChange}
      onSubmit={onSubmit}
      model={model}
      dh={dh}
    />
  );
}

it('renders without crashing', () => {
  makeChartBuilderWrapper();
});

it('updates the chart type', async () => {
  const user = userEvent.setup();
  const { getByText } = makeChartBuilderWrapper();

  const lineButton = getByText('Line');
  const barButton = getByText('Bar');

  expect(lineButton).toHaveClass('active');
  expect(barButton).not.toHaveClass('active');

  await user.click(barButton);

  expect(lineButton).not.toHaveClass('active');
  expect(barButton).toHaveClass('active');
});

it('has x-axis selection with the proper columns', async () => {
  const user = userEvent.setup();
  const { container } = makeChartBuilderWrapper();
  const xAxisSelectElm = container.querySelector(
    '.select-x-axis'
  ) as HTMLSelectElement;

  expect(xAxisSelectElm.querySelectorAll('option').length).toBe(
    COLUMN_NAMES.length
  );
  await user.selectOptions(xAxisSelectElm, COLUMN_NAMES[1]);

  expect(xAxisSelectElm.value).toBe(COLUMN_NAMES[1]);
});

it('updates series selection with the proper columns', async () => {
  const user = userEvent.setup();
  const { container } = makeChartBuilderWrapper();
  const seriesSelectElm = container.querySelector(
    '.select-series'
  ) as HTMLSelectElement;

  expect(seriesSelectElm.querySelectorAll('option').length).toBe(
    COLUMN_NAMES.length
  );
  expect(seriesSelectElm.value).toBe(COLUMN_NAMES[1]);
  await user.selectOptions(seriesSelectElm, COLUMN_NAMES[2]);
  expect(seriesSelectElm.value).toBe(COLUMN_NAMES[2]);
});

it('add and deletes series items', async () => {
  const user = userEvent.setup();
  const { getAllByTestId, getByTestId, getByText } = makeChartBuilderWrapper();
  const addSeriesItemBtn = getByText('Add Series');

  expect(getAllByTestId(/form-series-item-./).length).toBe(1);

  await user.click(addSeriesItemBtn);
  await user.click(addSeriesItemBtn);

  const seriesItem1 = getByTestId('select-series-item-1') as HTMLSelectElement;
  const seriesItem2 = getByTestId('select-series-item-2') as HTMLSelectElement;
  await user.selectOptions(seriesItem1, COLUMN_NAMES[3]);
  await user.selectOptions(seriesItem2, COLUMN_NAMES[2]);

  expect(seriesItem1.value).toBe(COLUMN_NAMES[3]);
  expect(seriesItem2.value).toBe(COLUMN_NAMES[2]);

  await user.click(getByTestId('delete-series-1'));

  expect(getAllByTestId(/form-series-item-./).length).toBe(2);
  expect((getByTestId('select-series-item-1') as HTMLSelectElement).value).toBe(
    COLUMN_NAMES[2]
  );
});

it('updates linked state', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const { container } = makeChartBuilderWrapper({ onChange });

  const linkButton = container.querySelector(
    '.chart-builder-link input[type="radio"][value="true"]'
  )!;

  const unlinkButton = container.querySelector(
    '.chart-builder-link input[type="radio"][value="false"]'
  )!;

  expect(onChange).not.toHaveBeenCalled();

  await user.click(unlinkButton);

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ isLinked: false })
  );
  onChange.mockClear();

  await user.click(linkButton);
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ isLinked: true })
  );
});

it('resets the form properly', async () => {
  const user = userEvent.setup();
  const { container } = makeChartBuilderWrapper();
  const addSeriesItemBtn = container.querySelector('.btn-add-series')!;

  await user.click(addSeriesItemBtn);
  await user.click(addSeriesItemBtn);

  await user.click(container.querySelector('.btn-reset')!);

  expect(container.querySelectorAll('.form-series-item').length).toBe(1);
});

it('handles form submission', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  const { container } = makeChartBuilderWrapper({ onSubmit });

  await user.click(container.querySelector('.btn-submit')!);

  expect(onSubmit).toHaveBeenCalledTimes(1);
});

it('calls onChange when fields are updated', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const { container } = makeChartBuilderWrapper({ onChange });
  const addSeriesItemBtn = container.querySelector('.btn-add-series')!;

  await user.selectOptions(
    container.querySelector('.select-series')!,
    COLUMN_NAMES[1]
  );

  await user.click(addSeriesItemBtn);
  await user.click(addSeriesItemBtn);
  await user.selectOptions(
    container.querySelectorAll('.select-series')[2],
    COLUMN_NAMES[2]
  );

  await user.click(container.querySelectorAll('.btn-chart-type')[1]);

  expect(onChange).toHaveBeenCalledTimes(5);
});
