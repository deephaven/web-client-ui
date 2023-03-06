import InvalidMetadataError from './InvalidMetadataError';

it('should create an InvalidMetadataError object', () => {
  const error = new InvalidMetadataError();
  expect(error.isInvalidMetadata).toBe(true);
});
