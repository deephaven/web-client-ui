import React from 'react';
import { mount } from 'enzyme';
import dh from '@deephaven/jsapi-shim';
import TableViewportUpdater from './TableViewportUpdater';

jest.useFakeTimers();

function makeTable() {
  const columns = [new dh.Column({ index: 0, name: '0' })];
  return new dh.Table({ columns });
}

function mountUpdater(table = makeTable(), bottom = 50, top = 0) {
  return mount(
    <TableViewportUpdater table={table} top={top} bottom={bottom} />
  );
}

it('renders without crashing', () => {
  mountUpdater();
});

it('updates viewport on mount', () => {
  const table = makeTable();
  table.setViewport = jest.fn();

  mountUpdater(table);
  jest.runAllTimers();
  expect(table.setViewport).toHaveBeenCalled();
});

describe('verify updates', () => {
  let wrapper = null;
  let table = null;
  let subscriptionSetViewport = null;

  beforeEach(() => {
    table = makeTable();
    subscriptionSetViewport = jest.fn();
    table.setViewport = jest.fn(() => ({
      setViewport: subscriptionSetViewport,
    }));
    wrapper = mountUpdater(table);
    jest.advanceTimersByTime(500);
    expect(table.setViewport).toHaveBeenCalledTimes(1);
    expect(subscriptionSetViewport).not.toHaveBeenCalled();
    table.setViewport.mockClear();

    setTimeout.mockClear();
  });

  it('updates when props are updated', () => {
    wrapper.setProps({ top: 100, bottom: 150 });

    jest.advanceTimersByTime(500);
    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(1);
  });

  it('queues multiple updates made rapidly', () => {
    wrapper.setProps({ top: 100, bottom: 150 });
    wrapper.setProps({ top: 125, bottom: 175 });

    jest.advanceTimersByTime(500);

    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(2);

    wrapper.setProps({ top: 150, bottom: 200 });
    wrapper.setProps({ top: 175, bottom: 225 });

    jest.advanceTimersByTime(500);

    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(4);

    jest.runAllTimers(); // This checks there are no pending updates basically
    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(4);
  });

  it('runs updates immediately if spaced apart', () => {
    wrapper.setProps({ top: 100, bottom: 150 });
    jest.advanceTimersByTime(500);

    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(1);

    wrapper.setProps({ top: 125, bottom: 175 });
    jest.advanceTimersByTime(500);

    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(2);

    wrapper.setProps({ top: 150, bottom: 200 });
    jest.advanceTimersByTime(500);

    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(3);

    jest.runAllTimers(); // This checks there are no pending updates basically
    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(3);
  });
});
