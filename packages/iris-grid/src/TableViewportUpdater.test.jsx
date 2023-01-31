import React from 'react';
import { render } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import TableViewportUpdater from './TableViewportUpdater';

jest.useFakeTimers();

function makeTable() {
  const columns = [new dh.Column({ index: 0, name: '0' })];
  return new dh.Table({ columns });
}

function makeUpdater(table = makeTable(), bottom = 50, top = 0) {
  return <TableViewportUpdater table={table} top={top} bottom={bottom} />;
}

it('renders without crashing', () => {
  const mockCloseSub = jest.fn();
  TableViewportUpdater.prototype.closeSubscription = mockCloseSub;
  render(makeUpdater());
});

it('updates viewport on mount', () => {
  const mockCloseSub = jest.fn();
  TableViewportUpdater.prototype.closeSubscription = mockCloseSub;
  const table = makeTable();
  table.setViewport = jest.fn();

  render(makeUpdater(table));
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
      close: jest.fn(),
    }));

    wrapper = render(makeUpdater(table));
    jest.advanceTimersByTime(500);
    expect(table.setViewport).toHaveBeenCalledTimes(1);
    expect(subscriptionSetViewport).not.toHaveBeenCalled();
    table.setViewport.mockClear();
  });

  it('updates when props are updated', () => {
    wrapper.rerender(makeUpdater(table, 150, 100));

    jest.advanceTimersByTime(500);
    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(1);
  });

  it('queues multiple updates made rapidly', () => {
    wrapper.rerender(makeUpdater(table, 150, 100));
    wrapper.rerender(makeUpdater(table, 175, 125));

    jest.advanceTimersByTime(500);

    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(2);
    wrapper.rerender(makeUpdater(table, 200, 150));
    wrapper.rerender(makeUpdater(table, 225, 175));

    jest.advanceTimersByTime(500);

    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(4);

    jest.runAllTimers(); // This checks there are no pending updates basically
    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(4);
  });

  it('runs updates immediately if spaced apart', () => {
    wrapper.rerender(makeUpdater(table, 150, 100));
    jest.advanceTimersByTime(500);

    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(1);

    wrapper.rerender(makeUpdater(table, 175, 125));
    jest.advanceTimersByTime(500);

    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(2);

    wrapper.rerender(makeUpdater(table, 200, 150));
    jest.advanceTimersByTime(500);

    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(3);

    jest.runAllTimers(); // This checks there are no pending updates basically
    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscriptionSetViewport).toHaveBeenCalledTimes(3);
  });
});
