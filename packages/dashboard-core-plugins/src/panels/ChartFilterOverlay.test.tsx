import React from 'react';
import { render, screen } from '@testing-library/react';
import { InputFilter } from '@deephaven/iris-grid';
import ChartFilterOverlay, { ColumnMap } from './ChartFilterOverlay';

const emptyTestMap = new Map<string, InputFilter>([]);

function makeChartFilterOverlay(
  waitingFilterMap: Map<string, InputFilter>,
  waitingInputMap: Map<string, unknown>
) {
  return render(
    <ChartFilterOverlay
      columnMap={emptyTestMap as ColumnMap}
      inputFilterMap={emptyTestMap}
      linkedColumnMap={emptyTestMap}
      onAdd={jest.fn()}
      onOpenLinker={jest.fn()}
      waitingFilterMap={waitingFilterMap}
      waitingInputMap={waitingInputMap}
    />
  );
}

it('mounts and unmounts successfully without crashing', () => {
  makeChartFilterOverlay(emptyTestMap, emptyTestMap);
});

describe('renders the appropriate text and buttons based on columns', () => {
  const testInputFilter = {
    name: 'TEST_NAME',
    type: 'TEST_TYPE',
    value: 'TEST_VALUE',
  };
  const waitingMap = new Map<string, InputFilter>([
    ['TEST_NAME', testInputFilter],
  ]);

  test('no waiting filters and no waiting input', () => {
    makeChartFilterOverlay(emptyTestMap, emptyTestMap);
    const message = screen.queryAllByText('Waiting for User Input');
    const buttons = screen.queryAllByRole('button');
    expect(message).toHaveLength(0);
    expect(buttons).toHaveLength(0);
  });

  test('waiting filters and no waiting input', () => {
    makeChartFilterOverlay(waitingMap, emptyTestMap);
    const message = screen.queryAllByText('Waiting for User Input');
    const buttons = screen.queryAllByRole('button');
    expect(message).toHaveLength(0);
    expect(buttons).toHaveLength(2);
  });

  test('no waiting filters and waiting input', () => {
    makeChartFilterOverlay(emptyTestMap, waitingMap);
    const message = screen.queryAllByText('Waiting for User Input');
    const buttons = screen.queryAllByRole('button');
    expect(message).toHaveLength(1);
    expect(buttons).toHaveLength(0);
  });

  test('waiting filters and waiting input', () => {
    makeChartFilterOverlay(waitingMap, waitingMap);
    const message = screen.queryAllByText('Waiting for User Input');
    const buttons = screen.queryAllByRole('button');
    expect(message).toHaveLength(0);
    expect(buttons).toHaveLength(2);
  });
});
