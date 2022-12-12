import dh, { VariableDefinition } from '@deephaven/jsapi-shim';
import { TimeoutError } from '@deephaven/utils';
import { fetchVariableDefinition } from './ConnectionUtils';

const mockRemoveListener = jest.fn();
const mockSubscribeToFieldUpdates = jest.fn(
  changeListener => mockRemoveListener
);

const connection = new dh.IdeConnection('http://mockserver');
connection.subscribeToFieldUpdates = mockSubscribeToFieldUpdates;

const testDefinition1: VariableDefinition = {
  title: 'TEST_DEF',
  type: dh.VariableType.TABLE,
};

const testDefinition2: VariableDefinition = {
  title: 'ANOTHER_DEF',
  type: dh.VariableType.FIGURE,
};

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  mockRemoveListener.mockClear();
  mockSubscribeToFieldUpdates.mockClear();
});

it('finds the right definition if variable exists', async () => {
  const fetchPromise = fetchVariableDefinition(
    connection,
    testDefinition1.title ?? ''
  );

  expect(mockSubscribeToFieldUpdates).toHaveBeenCalled();
  expect(mockRemoveListener).not.toHaveBeenCalled();

  const listener = mockSubscribeToFieldUpdates.mock.calls[0][0];

  listener({
    created: [testDefinition1, testDefinition2],
    updated: [],
    removed: [],
  });

  const result = await fetchPromise;

  expect(result).toBe(testDefinition1);
  expect(mockRemoveListener).toHaveBeenCalled();
});

it('finds the definition in the second update if not after the first update', async () => {
  const fetchPromise = fetchVariableDefinition(
    connection,
    testDefinition2.title ?? ''
  );

  expect(mockSubscribeToFieldUpdates).toHaveBeenCalled();
  expect(mockRemoveListener).not.toHaveBeenCalled();

  const listener = mockSubscribeToFieldUpdates.mock.calls[0][0];

  listener({
    created: [testDefinition1],
    updated: [],
    removed: [],
  });

  expect(mockRemoveListener).not.toHaveBeenCalled();

  listener({
    created: [testDefinition2],
    updated: [],
    removed: [],
  });

  const result = await fetchPromise;

  expect(result).toBe(testDefinition2);
  expect(mockRemoveListener).toHaveBeenCalled();
});

it('throws a TimeoutError if variable not found', async () => {
  const fetchPromise = fetchVariableDefinition(
    connection,
    testDefinition2.title ?? ''
  );

  expect(mockSubscribeToFieldUpdates).toHaveBeenCalled();
  expect(mockRemoveListener).not.toHaveBeenCalled();

  const listener = mockSubscribeToFieldUpdates.mock.calls[0][0];

  listener({
    created: [testDefinition1],
    updated: [],
    removed: [],
  });

  expect(mockRemoveListener).not.toHaveBeenCalled();

  jest.runOnlyPendingTimers();

  expect(mockRemoveListener).toHaveBeenCalled();

  await expect(fetchPromise).rejects.toThrow(TimeoutError);
});
