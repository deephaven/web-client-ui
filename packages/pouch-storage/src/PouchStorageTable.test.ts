import { makePouchFilter } from './PouchStorageTable';

describe('PouchStorageTable - Filter Functions', () => {
  describe('makePouchFilter', () => {
    it.each([
      ['eq', 'value', { $eq: 'value' }],
      ['notEq', 'value', { $ne: 'value' }],
      ['greaterThan', 'value', { $gt: 'value' }],
      ['greaterThanOrEqualTo', 'value', { $gte: 'value' }],
      ['lessThan', 'value', { $lt: 'value' }],
      ['lessThanOrEqualTo', 'value', { $lte: 'value' }],
    ])(
      'should create a PouchFilter for %s operator',
      (type, value, expected) => {
        const filter = makePouchFilter(type, value);
        expect(filter).toEqual(expected);
      }
    );

    it('should throw an error for unsupported filter types', () => {
      expect(() => makePouchFilter('unsupported', 'value')).toThrow(
        'Unsupported type: unsupported'
      );
    });
  });
});
