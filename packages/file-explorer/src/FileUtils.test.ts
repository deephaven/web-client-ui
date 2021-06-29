import FileUtils from './FileUtils';

it('gets extension', () => {
  function testName(name: string, expectedExtension: string) {
    expect(FileUtils.getExtension(name)).toBe(expectedExtension);
  }
  testName('noext', '');
  testName('plain.txt', 'txt');
  testName('file.py', 'py');
  testName('file.tar.gz', 'gz');
  testName('/foo/bar/', '');
  testName('/foo/bar/baz.txt', 'txt');
  testName('/foo.bar/baz.txt', 'txt');
  testName('/foo.bar/baz', '');
});

it('gets the path', () => {
  function testName(name: string, expectedPath: string) {
    expect(FileUtils.getPath(name)).toBe(expectedPath);
  }

  function testError(name: string) {
    expect(() => FileUtils.getPath(name)).toThrow();
  }

  testName('/', '/');
  testName('/foo.txt', '/');
  testName('/foo/', '/foo/');
  testName('/foo/bar.txt', '/foo/');
  testName('/foo/bar/baz.txt', '/foo/bar/');

  testError('nopath.txt');
  testError('nopath');
  testError('invalid/path');
});

it('gets the filename', () => {
  function testName(name: string, expectedName: string) {
    expect(FileUtils.getBaseName(name)).toBe(expectedName);
  }

  testName('/', '');
  testName('/foo.txt', 'foo.txt');
  testName('/foo/', '');
  testName('/foo/bar.txt', 'bar.txt');
  testName('/foo/bar/baz.txt', 'baz.txt');
});

it('gets the depth', () => {
  function testName(name: string, expectedDepth: number) {
    expect(FileUtils.getDepth(name)).toBe(expectedDepth);
  }

  function testError(name: string) {
    expect(() => FileUtils.getDepth(name)).toThrow();
  }

  testName('/', 0);
  testName('/foo.txt', 0);
  testName('/foo/bar.txt', 1);
  testName('/foo/bar/baz.txt', 2);

  testError('');
  testError('invalid/file');
  testError('nopath');
  testError('nopath.txt');
});
