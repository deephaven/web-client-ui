import type { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { fetchAuthHandlers, getAuthHandlers } from './AuthUtils';

describe('getAuthHandlers', () => {
  it('splits, trims and drops empty entries', () => {
    expect(getAuthHandlers(new Map([['AuthHandlers', ' a , b,,']]))).toEqual([
      'a',
      'b',
    ]);
  });

  it('splits on whitespace as well as commas', () => {
    expect(getAuthHandlers(new Map([['AuthHandlers', 'a b, c\td']]))).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
  });

  it('returns an empty array if AuthHandlers is empty', () => {
    expect(getAuthHandlers(new Map([['AuthHandlers', ' , ']]))).toEqual([]);
  });

  it('returns an empty array if AuthHandlers is missing', () => {
    expect(getAuthHandlers(new Map())).toEqual([]);
  });
});

describe('fetchAuthHandlers', () => {
  it('fetches auth handlers from the client', async () => {
    const client = TestUtils.createMockProxy<dh.CoreClient>({
      getAuthConfigValues: jest.fn(async () => [['AuthHandlers', 'x,y']]),
    });

    await expect(fetchAuthHandlers(client)).resolves.toEqual(['x', 'y']);
  });
});
