import { render } from '@testing-library/react';
import CommandHistoryViewportUpdater from './CommandHistoryViewportUpdater';
import { type CommandHistoryTable } from './CommandHistoryStorage';

jest.mock('pouchdb-browser');

function makeCommandHistoryTable(itemLength = 100): CommandHistoryTable {
  return {
    onUpdate: jest.fn(() => jest.fn()),
    setSearch: jest.fn(),
    setReversed: jest.fn(),
    setViewport: jest.fn(),
    getSnapshot: jest.fn(),
    size: itemLength,
    getViewportData: jest.fn(),
    setFilters: jest.fn(),
    setSorts: jest.fn(),
    close: jest.fn(),
  } as unknown as CommandHistoryTable;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

it('subscribes a viewport while the panel is active', () => {
  const table = makeCommandHistoryTable();
  render(
    <CommandHistoryViewportUpdater
      table={table}
      top={0}
      bottom={10}
      isPanelActive
      onUpdate={jest.fn()}
    />
  );

  jest.runOnlyPendingTimers();

  expect(table.setViewport).toHaveBeenCalledWith(
    expect.objectContaining({
      top: expect.any(Number),
      bottom: expect.any(Number),
    })
  );
  // Was not asked to clear the viewport while active
  expect(table.setViewport).not.toHaveBeenCalledWith(undefined);
});

it('drops the viewport (unsubscribes) when the panel is backgrounded', () => {
  const table = makeCommandHistoryTable();
  const { rerender } = render(
    <CommandHistoryViewportUpdater
      table={table}
      top={0}
      bottom={10}
      isPanelActive
      onUpdate={jest.fn()}
    />
  );

  jest.runOnlyPendingTimers();
  (table.setViewport as jest.Mock).mockClear();

  rerender(
    <CommandHistoryViewportUpdater
      table={table}
      top={0}
      bottom={10}
      isPanelActive={false}
      onUpdate={jest.fn()}
    />
  );

  jest.runOnlyPendingTimers();

  // Backgrounded: viewport is cleared and no real range is subscribed
  expect(table.setViewport).toHaveBeenCalledWith(undefined);
  expect(table.setViewport).not.toHaveBeenCalledWith(
    expect.objectContaining({ bottom: expect.any(Number) })
  );
});

it('does not subscribe a viewport when starting backgrounded', () => {
  const table = makeCommandHistoryTable();
  render(
    <CommandHistoryViewportUpdater
      table={table}
      top={0}
      bottom={10}
      isPanelActive={false}
      onUpdate={jest.fn()}
    />
  );

  jest.runOnlyPendingTimers();

  expect(table.setViewport).not.toHaveBeenCalledWith(
    expect.objectContaining({ bottom: expect.any(Number) })
  );
  expect(table.setViewport).toHaveBeenCalledWith(undefined);
});
