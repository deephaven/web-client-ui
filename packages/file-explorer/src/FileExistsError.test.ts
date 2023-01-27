import FileExistsError from './FileExistsError';

it('creates an error object', () => {
  const err = new FileExistsError({
    id: 'test',
    type: 'file',
    filename: '/home/test',
    basename: 'test',
  });

  expect(err.info.id).toBe('test');
  expect(err.info.type).toBe('file');
  expect(err.info.filename).toBe('/home/test');
  expect(err.info.basename).toBe('test');
  expect(err.isExistingFile).toBe(true);
});
