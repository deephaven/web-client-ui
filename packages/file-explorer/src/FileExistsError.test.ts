import FileExistsError from './FileExistsError';
import { makeFile } from './FileTestUtils';

it('creates an error object', () => {
  const file = makeFile('test');

  const err = new FileExistsError(file);

  expect(err.info.id).toBe(file.id);
  expect(err.info.type).toBe(file.type);
  expect(err.info.filename).toBe(file.filename);
  expect(err.info.basename).toBe(file.basename);
  expect(err.isExistingFile).toBe(true);
});
