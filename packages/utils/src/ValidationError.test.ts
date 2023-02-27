import ValidationError from './ValidationError';

it('should create a ValidationError object', () => {
  const error = new ValidationError();
  expect(error.isInvalid).toBe(true);
});
