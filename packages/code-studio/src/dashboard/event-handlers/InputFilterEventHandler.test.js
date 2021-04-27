import InputFilterEventHandler from './InputFilterEventHandler';
import { InputFilterEvent, PanelEvent } from '../events';

function getCallbackForEvent(calls, event) {
  return calls.find(([e]) => e === event)[1];
}

function makeColumn(name = 'A', type = 'int') {
  return { name, type };
}

function makeColumns() {
  return [
    makeColumn('A', 'int'),
    makeColumn('B', 'String'),
    makeColumn('C', 'Date'),
  ];
}

function makeFilter({ name = 'A', type = 'int', value = '10' } = {}) {
  return { name, type, value };
}

function makeTable({ columns = makeColumns(), size = 100 } = {}) {
  return { columns, size };
}

function makeLayout() {
  return {
    eventHub: { on: jest.fn(), off: jest.fn() },
  };
}

function makePanel(id = 'UNKNOWN') {
  return { props: { glContainer: { config: { id } } } };
}

it('sets up listeners for the proper events', () => {
  const layout = makeLayout();
  const handler = new InputFilterEventHandler(layout, jest.fn());
  expect(layout.eventHub.on).toHaveBeenCalledWith(
    InputFilterEvent.COLUMNS_CHANGED,
    expect.anything()
  );
  expect(layout.eventHub.on).toHaveBeenCalledWith(
    InputFilterEvent.FILTERS_CHANGED,
    expect.anything()
  );
  expect(layout.eventHub.on).toHaveBeenCalledWith(
    PanelEvent.UNMOUNT,
    expect.anything()
  );
  expect(layout.eventHub.off).not.toHaveBeenCalled();

  handler.stopListening();
  expect(layout.eventHub.off).toHaveBeenCalledWith(
    InputFilterEvent.COLUMNS_CHANGED,
    expect.anything()
  );
  expect(layout.eventHub.off).toHaveBeenCalledWith(
    InputFilterEvent.FILTERS_CHANGED,
    expect.anything()
  );
  expect(layout.eventHub.off).toHaveBeenCalledWith(
    PanelEvent.UNMOUNT,
    expect.anything()
  );
});

it('updates columns and filters correctly', () => {
  const layout = makeLayout();
  const onInputFiltersChanged = jest.fn();
  const testUpdate = (expectedFilters, expectedColumns) => {
    expect(onInputFiltersChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expectedFilters,
        columns: expectedColumns,
      })
    );
    onInputFiltersChanged.mockClear();
  };
  const handler = new InputFilterEventHandler(layout, onInputFiltersChanged);
  const table1 = makeTable();
  const table2 = makeTable({
    columns: [
      makeColumn('A', 'int'), // Same as previous 'A', should only have one column 'A' in output
      makeColumn('B', 'long'), // Different type than other 'B', both should be in output
      makeColumn('D', 'double'), // Different name and type, should appear in output
    ],
  });
  const filters = [makeFilter(), makeFilter({ name: 'B' })];
  const panel1 = makePanel('1');
  const panel2 = makePanel('2');
  const panel3 = makePanel('3');

  const onColumnsChanged = getCallbackForEvent(
    layout.eventHub.on.mock.calls,
    InputFilterEvent.COLUMNS_CHANGED
  );
  const onFiltersChanged = getCallbackForEvent(
    layout.eventHub.on.mock.calls,
    InputFilterEvent.FILTERS_CHANGED
  );

  const onPanelUnmount = getCallbackForEvent(
    layout.eventHub.on.mock.calls,
    PanelEvent.UNMOUNT
  );

  onColumnsChanged(panel1, table1.columns);
  let expectedColumns = table1.columns;
  let expectedFilters = [];
  testUpdate(expectedFilters, expectedColumns);

  onColumnsChanged(panel2, table2.columns);
  expectedColumns = [
    table1.columns[0],
    table2.columns[1], // B's type in table 2 should come first
    table1.columns[1],
    table1.columns[2],
    table2.columns[2],
  ];
  testUpdate(expectedFilters, expectedColumns);

  onFiltersChanged(panel3, filters);
  expectedFilters = filters;
  testUpdate(expectedFilters, expectedColumns);

  expectedColumns = table2.columns;
  onPanelUnmount(panel1);
  testUpdate(expectedFilters, expectedColumns);

  expectedColumns = [];
  onPanelUnmount(panel2);
  testUpdate(expectedFilters, expectedColumns);

  expectedFilters = [];
  onPanelUnmount(panel3);
  testUpdate(expectedFilters, expectedColumns);

  handler.stopListening();
});
