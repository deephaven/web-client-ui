import TimeoutError from './TimeoutError';

it('should create a TimeoutError object', () => {
  const error = new TimeoutError();
  expect(error.isTimeout).toBe(true);
});
