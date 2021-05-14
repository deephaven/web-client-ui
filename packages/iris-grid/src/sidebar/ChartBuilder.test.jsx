import React from 'react';
import { mount } from 'enzyme';
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
  return mount(
    <ChartBuilder onChange={onChange} onSubmit={onSubmit} model={model} />
  );
}

it('renders without crashing', () => {
  const wrapper = makeChartBuilderWrapper();
  wrapper.unmount();
});

it('updates the chart type', () => {
  const wrapper = makeChartBuilderWrapper();

  let chartButtons = wrapper.find('.btn-chart-type');
  expect(wrapper.state('type')).toBe(ChartBuilder.types[0]);
  expect(chartButtons.at(0).hasClass('active')).toBe(true);
  expect(chartButtons.at(1).hasClass('active')).toBe(false);

  chartButtons.at(1).simulate('click');

  chartButtons = wrapper.find('.btn-chart-type');

  expect(wrapper.state('type')).toBe(ChartBuilder.types[1]);
  expect(chartButtons.at(0).hasClass('active')).toBe(false);
  expect(chartButtons.at(1).hasClass('active')).toBe(true);

  wrapper.unmount();
});

it('has x-axis selection with the proper columns', () => {
  const wrapper = makeChartBuilderWrapper();

  expect(wrapper.find('.select-x-axis').children().length).toBe(
    COLUMN_NAMES.length
  );
  expect(wrapper.find('.select-x-axis').instance().value).toBe(COLUMN_NAMES[0]);
  expect(wrapper.state('xAxis')).toBe(COLUMN_NAMES[0]);

  wrapper.find('.select-x-axis').childAt(1).simulate('change');
  expect(wrapper.state('xAxis')).toBe(COLUMN_NAMES[1]);

  wrapper.unmount();
});

it('updates series selection with the proper columns', () => {
  const wrapper = makeChartBuilderWrapper();

  expect(wrapper.find('.select-series').children().length).toBe(
    COLUMN_NAMES.length
  );
  expect(wrapper.find('.select-series').instance().value).toBe(COLUMN_NAMES[1]);
  expect(wrapper.state('seriesItems').map(item => item.value)).toEqual([
    COLUMN_NAMES[1],
  ]);

  wrapper.find('.select-series').childAt(2).simulate('change');
  expect(wrapper.state('seriesItems').map(item => item.value)).toEqual([
    COLUMN_NAMES[2],
  ]);

  wrapper.unmount();
});

it('add and deletes series items', () => {
  const wrapper = makeChartBuilderWrapper();

  expect(wrapper.state('seriesItems').length).toBe(1);

  wrapper.find('.btn-add-series').simulate('click');
  wrapper.find('.btn-add-series').simulate('click');

  expect(wrapper.state('seriesItems').length).toBe(3);

  wrapper.find('.select-series').at(1).childAt(3).simulate('change');
  wrapper.find('.select-series').at(2).childAt(2).simulate('change');

  expect(wrapper.state('seriesItems').map(item => item.value)).toEqual([
    COLUMN_NAMES[1],
    COLUMN_NAMES[3],
    COLUMN_NAMES[2],
  ]);

  wrapper.find('.btn-delete-series').at(0).simulate('click');

  expect(wrapper.state('seriesItems').map(item => item.value)).toEqual([
    COLUMN_NAMES[3],
    COLUMN_NAMES[2],
  ]);
});

it('updates linked state', () => {
  const wrapper = makeChartBuilderWrapper();

  expect(wrapper.state('isLinked')).toBe(true);

  wrapper
    .find('.chart-builder-link input[type="radio"]')
    .at(1)
    .simulate('change', { target: { value: 'false' } });

  expect(wrapper.state('isLinked')).toBe(false);

  wrapper
    .find('.chart-builder-link input[type="radio"]')
    .at(0)
    .simulate('change', { target: { value: 'true' } });

  expect(wrapper.state('isLinked')).toBe(true);
});

it('resets the form properly', () => {
  const wrapper = makeChartBuilderWrapper();

  wrapper.find('.btn-add-series').simulate('click');
  wrapper.find('.btn-add-series').simulate('click');
  wrapper.find('.btn-add-series').simulate('click');

  wrapper.find('.btn-reset').simulate('click');

  expect(wrapper.state('seriesItems').length).toBe(1);

  wrapper.unmount();
});

it('handles form submission', () => {
  const onSubmit = jest.fn();
  const wrapper = makeChartBuilderWrapper({ onSubmit });

  wrapper.find('.btn-submit').simulate('submit');

  expect(onSubmit).toHaveBeenCalled();

  wrapper.unmount();
});

it('calls onChange when fields are updated', () => {
  const onChange = jest.fn();
  const wrapper = makeChartBuilderWrapper({ onChange });

  wrapper.find('.select-series').childAt(1).simulate('change');
  wrapper.find('.btn-add-series').simulate('click');
  wrapper.find('.btn-add-series').simulate('click');
  wrapper.find('.select-series').at(2).childAt(2).simulate('change');
  wrapper.find('.btn-chart-type').at(1).simulate('click');

  expect(onChange).toHaveBeenCalledTimes(5);

  wrapper.unmount();
});
