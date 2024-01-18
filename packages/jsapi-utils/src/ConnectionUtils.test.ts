import dh from '@deephaven/jsapi-shim';
import { TimeoutError } from '@deephaven/utils';
import { fetchVariableDefinition } from './ConnectionUtils';

const mockRemoveListener = jest.fn();
const mockSubscribeToFieldUpdates = jest.fn(
  changeListener => mockRemoveListener
);

const connection = new dh.IdeConnection('http://mockserver');
connection.subscribeToFieldUpdates = mockSubscribeToFieldUpdates;

const testDefinition1 = {
  title: 'TEST_DEF',
  type: dh.VariableType.TABLE,
};

const testDefinition2 = {
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
    testDefinition1.title
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

it('throws a TimeoutError if finding the variable timed out', async () => {
  const timeout = 1000;
  const fetchPromise = fetchVariableDefinition(
    connection,
    testDefinition2.title,
    timeout
  );

  expect(mockSubscribeToFieldUpdates).toHaveBeenCalled();
  expect(mockRemoveListener).not.toHaveBeenCalled();

  jest.advanceTimersByTime(timeout + 2000);

  await expect(fetchPromise).rejects.toThrow(TimeoutError);
  expect(mockRemoveListener).toHaveBeenCalled();
});

it('throws an Error if variable not found', async () => {
  const fetchPromise = fetchVariableDefinition(
    connection,
    testDefinition2.title
  );

  expect(mockSubscribeToFieldUpdates).toHaveBeenCalled();
  expect(mockRemoveListener).not.toHaveBeenCalled();

  const listener = mockSubscribeToFieldUpdates.mock.calls[0][0];

  listener({
    created: [testDefinition1],
    updated: [],
    removed: [],
  });

  await expect(fetchPromise).rejects.toThrow(Error);
  await expect(fetchPromise).rejects.not.toThrow(TimeoutError);
  expect(mockRemoveListener).toHaveBeenCalled();
});
