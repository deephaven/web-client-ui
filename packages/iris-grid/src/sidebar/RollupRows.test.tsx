import { type dh as DhType } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import RollupRows from './RollupRows';

it('should allow all column types to be groupable', () => {
  function testType(type: string, expected = true) {
    const column = TestUtils.createMockProxy<DhType.Column>({ type });
    expect(RollupRows.isGroupable(column)).toBe(expected);
  }

  testType('string');
  testType('int');
  testType('long');
  testType('float');
  testType('double');
  testType('java.lang.String');
  testType('java.lang.Integer');
  testType('java.lang.Long');
  testType('java.math.BigDecimal', false);
  testType('java.math.BigInteger', false);
});
