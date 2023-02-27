import { assertNotNull } from './Asserts';

it('throws an error when a value is null', () => {
  expect(() => assertNotNull(null)).toThrowError('Value is null or undefined');
});
