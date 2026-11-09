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
