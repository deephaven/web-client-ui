import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChartBuilder from './ChartBuilder';
import IrisGridTestUtils from '../IrisGridTestUtils';

const COLUMN_NAMES = ['A', 'B', 'C', 'D'];

function makeChartBuilderWrapper({
  onChange = () => null,
  onSubmit = () => null,
  model = IrisGridTestUtils.makeModel(
    IrisGridTestUtils.makeTable(COLUMN_NAMES.map(IrisGridTestUtils.makeColumn))
  ),
} = {}) {
  return render(
    <ChartBuilder onChange={onChange} onSubmit={onSubmit} model={model} />
  );
}

it('renders without crashing', () => {
  makeChartBuilderWrapper();
});

it('updates the chart type', () => {
  const { getByText } = makeChartBuilderWrapper();

  const lineButton = getByText('Line');
  const barButton = getByText('Bar');

  expect(lineButton).toHaveClass('active');
  expect(barButton).not.toHaveClass('active');

  userEvent.click(barButton);

  expect(lineButton).not.toHaveClass('active');
  expect(barButton).toHaveClass('active');
});

it('has x-axis selection with the proper columns', () => {
  const { container } = makeChartBuilderWrapper();
  const xAxisSelectElm = container.querySelector('.select-x-axis');

  expect(xAxisSelectElm.querySelectorAll('option').length).toBe(
    COLUMN_NAMES.length
  );
  userEvent.selectOptions(xAxisSelectElm, COLUMN_NAMES[1]);

  expect(xAxisSelectElm.value).toBe(COLUMN_NAMES[1]);
});

it('updates series selection with the proper columns', () => {
  const { container } = makeChartBuilderWrapper();
  const seriesSelectElm = container.querySelector('.select-series');

  expect(seriesSelectElm.querySelectorAll('option').length).toBe(
    COLUMN_NAMES.length
  );
  expect(seriesSelectElm.value).toBe(COLUMN_NAMES[1]);
  userEvent.selectOptions(seriesSelectElm, COLUMN_NAMES[2]);
  expect(seriesSelectElm.value).toBe(COLUMN_NAMES[2]);
});

it('add and deletes series items', () => {
  const { getAllByTestId, getByTestId, getByText } = makeChartBuilderWrapper();
  const addSeriesItemBtn = getByText('Add Series');

  expect(getAllByTestId(/form-series-item-./).length).toBe(1);

  userEvent.click(addSeriesItemBtn);
  userEvent.click(addSeriesItemBtn);

  const seriesItem1 = getByTestId('select-series-item-1');
  const seriesItem2 = getByTestId('select-series-item-2');
  userEvent.selectOptions(seriesItem1, COLUMN_NAMES[3]);
  userEvent.selectOptions(seriesItem2, COLUMN_NAMES[2]);

  expect(seriesItem1.value).toBe(COLUMN_NAMES[3]);
  expect(seriesItem2.value).toBe(COLUMN_NAMES[2]);

  userEvent.click(getByTestId('delete-series-1'));

  expect(getAllByTestId(/form-series-item-./).length).toBe(2);
  expect(getByTestId('select-series-item-1').value).toBe(COLUMN_NAMES[2]);
});

it('updates linked state', () => {
  const onChange = jest.fn();
  const { container } = makeChartBuilderWrapper({ onChange });

  const linkButton = container.querySelector(
    '.chart-builder-link input[type="radio"][value="true"]'
  );
  const unlinkButton = container.querySelector(
    '.chart-builder-link input[type="radio"][value="false"]'
  );

  expect(onChange).not.toHaveBeenCalled();

  userEvent.click(unlinkButton);

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ isLinked: false })
  );
  onChange.mockClear();

  userEvent.click(linkButton);
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ isLinked: true })
  );
});

it('resets the form properly', () => {
  const { container } = makeChartBuilderWrapper();
  const addSeriesItemBtn = container.querySelector('.btn-add-series');

  userEvent.click(addSeriesItemBtn);
  userEvent.click(addSeriesItemBtn);

  userEvent.click(container.querySelector('.btn-reset'));

  expect(container.querySelectorAll('.form-series-item').length).toBe(1);
});

it('handles form submission', () => {
  const onSubmit = jest.fn();
  const { container } = makeChartBuilderWrapper({ onSubmit });

  userEvent.click(container.querySelector('.btn-submit'));

  expect(onSubmit).toHaveBeenCalledTimes(1);
});

it('calls onChange when fields are updated', () => {
  const onChange = jest.fn();
  const { container } = makeChartBuilderWrapper({ onChange });
  const addSeriesItemBtn = container.querySelector('.btn-add-series');

  userEvent.selectOptions(
    container.querySelector('.select-series'),
    COLUMN_NAMES[1]
  );

  userEvent.click(addSeriesItemBtn);
  userEvent.click(addSeriesItemBtn);
  userEvent.selectOptions(
    container.querySelectorAll('.select-series')[2],
    COLUMN_NAMES[2]
  );

  userEvent.click(container.querySelectorAll('.btn-chart-type')[1]);

  expect(onChange).toHaveBeenCalledTimes(5);
});
