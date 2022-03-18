import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChartBuilder from './ChartBuilder';
import IrisGridTestUtils from '../IrisGridTestUtils';

const COLUMN_NAMES = ['A', 'B', 'C', 'D'];

function makeChartBuilderWrapper({
  onChange = () => {},
  onSubmit = () => {},
  model = IrisGridTestUtils.makeModel(
    IrisGridTestUtils.makeTable(COLUMN_NAMES.map(IrisGridTestUtils.makeColumn))
  ),
} = {}) {
  return render(
    <ChartBuilder onChange={onChange} onSubmit={onSubmit} model={model} />
  );
}

it('renders without crashing', () => {
  const { unmount } = makeChartBuilderWrapper();
  unmount();
});

it('updates the chart type', () => {
  const { container, unmount } = makeChartBuilderWrapper();

  let chartButtons = container.querySelectorAll('.btn-chart-type');

  expect(chartButtons[0].classList.contains('active')).toBe(true);
  expect(chartButtons[1].classList.contains('active')).toBe(false);

  userEvent.click(chartButtons[1]);

  chartButtons = container.querySelectorAll('.btn-chart-type');

  expect(chartButtons[0].classList.contains('active')).toBe(false);
  expect(chartButtons[1].classList.contains('active')).toBe(true);

  unmount();
});

it('has x-axis selection with the proper columns', () => {
  const { container, unmount } = makeChartBuilderWrapper();
  const xAxisSelectElm = container.querySelector('.select-x-axis');

  expect(xAxisSelectElm.querySelectorAll('option').length).toBe(
    COLUMN_NAMES.length
  );
  expect(xAxisSelectElm.value).toBe(COLUMN_NAMES[0]);
  unmount();
});

it('updates series selection with the proper columns', () => {
  const { container, unmount } = makeChartBuilderWrapper();
  const seriesSelectElm = container.querySelector('.select-series');

  expect(seriesSelectElm.querySelectorAll('option').length).toBe(
    COLUMN_NAMES.length
  );
  expect(seriesSelectElm.value).toBe(COLUMN_NAMES[1]);

  unmount();
});

it('add and deletes series items', () => {
  const { container } = makeChartBuilderWrapper();
  const addSeriesItemBtn = container.querySelector('.btn-add-series');

  expect(container.querySelectorAll('.form-series-item').length).toBe(1);

  userEvent.click(addSeriesItemBtn);
  userEvent.click(addSeriesItemBtn);

  expect(container.querySelectorAll('.form-series-item').length).toBe(3);
});

it('resets the form properly', () => {
  const { container, unmount } = makeChartBuilderWrapper();
  const addSeriesItemBtn = container.querySelector('.btn-add-series');

  userEvent.click(addSeriesItemBtn);
  userEvent.click(addSeriesItemBtn);

  userEvent.click(container.querySelector('.btn-reset'));

  expect(container.querySelectorAll('.form-series-item').length).toBe(1);

  unmount();
});

it('handles form submission', () => {
  const onSubmit = jest.fn();
  const { container, unmount } = makeChartBuilderWrapper({ onSubmit });

  userEvent.click(container.querySelector('.btn-submit'));

  expect(onSubmit).toHaveBeenCalled();

  unmount();
});

it('calls onChange when fields are updated', () => {
  const onChange = jest.fn();
  const { container, unmount } = makeChartBuilderWrapper({ onChange });
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

  unmount();
});
