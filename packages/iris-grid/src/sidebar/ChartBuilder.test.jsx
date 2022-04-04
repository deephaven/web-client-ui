import React from 'react';
import { render, screen } from '@testing-library/react';
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
  const { unmount } = makeChartBuilderWrapper();

  const lineButton = screen.getByText('Line');
  const barButton = screen.getByText('Bar');

  expect(lineButton.classList.contains('active')).toBe(true);
  expect(barButton.classList.contains('active')).toBe(false);

  userEvent.click(barButton);

  expect(lineButton.classList.contains('active')).toBe(false);
  expect(barButton.classList.contains('active')).toBe(true);

  unmount();
});

it('has x-axis selection with the proper columns', () => {
  const { container, unmount } = makeChartBuilderWrapper();
  const xAxisSelectElm = container.querySelector('.select-x-axis');

  expect(xAxisSelectElm.querySelectorAll('option').length).toBe(
    COLUMN_NAMES.length
  );
  userEvent.selectOptions(xAxisSelectElm, COLUMN_NAMES[1]);

  expect(xAxisSelectElm.value).toBe(COLUMN_NAMES[1]);
  unmount();
});

it('updates series selection with the proper columns', () => {
  const { container, unmount } = makeChartBuilderWrapper();
  const seriesSelectElm = container.querySelector('.select-series');

  expect(seriesSelectElm.querySelectorAll('option').length).toBe(
    COLUMN_NAMES.length
  );
  expect(seriesSelectElm.value).toBe(COLUMN_NAMES[1]);
  userEvent.selectOptions(seriesSelectElm, COLUMN_NAMES[2]);
  expect(seriesSelectElm.value).toBe(COLUMN_NAMES[2]);

  unmount();
});

it('add and deletes series items', () => {
  const { unmount } = makeChartBuilderWrapper();
  const addSeriesItemBtn = screen.getByText('Add Series');

  expect(screen.getAllByTestId(/form-series-item-./).length).toBe(1);

  userEvent.click(addSeriesItemBtn);
  userEvent.click(addSeriesItemBtn);

  const seriesItem1 = screen.getByTestId('select-series-item-1');
  const seriesItem2 = screen.getByTestId('select-series-item-2');
  userEvent.selectOptions(seriesItem1, COLUMN_NAMES[3]);
  userEvent.selectOptions(seriesItem2, COLUMN_NAMES[2]);

  expect(seriesItem1.value).toBe(COLUMN_NAMES[3]);
  expect(seriesItem2.value).toBe(COLUMN_NAMES[2]);

  userEvent.click(screen.getByTestId('delete-series-1'));

  expect(screen.getAllByTestId(/form-series-item-./).length).toBe(2);
  expect(screen.getByTestId('select-series-item-1').value).toBe(
    COLUMN_NAMES[2]
  );

  unmount();
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

  expect(onSubmit).toHaveBeenCalledTimes(1);

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
