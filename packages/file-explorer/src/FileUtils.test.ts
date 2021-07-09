import FileUtils from './FileUtils';

function testValidFileName(name: string): void {
  return expect(() => FileUtils.validateName(name)).not.toThrow();
}

function testInvalidFileName(name: string): void {
  return expect(() => FileUtils.validateName(name)).toThrow();
}

function testInvalidFileNameMessage(name: string, message: string): void {
  // toThrowError with an error object tests for exact message match
  return expect(() => FileUtils.validateName(name)).toThrowError(
    new Error(message)
  );
}

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

it('gets the parent', () => {
  function testName(name: string, expectedPath: string) {
    expect(FileUtils.getParent(name)).toBe(expectedPath);
  }

  function testError(name: string) {
    expect(() => FileUtils.getParent(name)).toThrow();
  }

  testName('/foo.txt', '/');
  testName('/foo/', '/');
  testName('/foo/bar.txt', '/foo/');
  testName('/foo/bar/', '/foo/');
  testName('/foo/bar/baz.txt', '/foo/bar/');

  testError('/');
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

describe('validateItemName for files', () => {
  it('rejects for invalid names', () => {
    testInvalidFileName('');
    testInvalidFileName('test/test');
    testInvalidFileName('test\\test');
    testInvalidFileName('test\0test');
  });

  it('rejects with correct error messages', () => {
    // Prints invalid char only once for all matches
    testInvalidFileNameMessage(
      '/test/test/',
      'Invalid characters in name: "/"'
    );
    // Prints all invalid chars
    testInvalidFileNameMessage(
      '\\test\\test/',
      'Invalid characters in name: "\\", "/"'
    );
    // Prints "null" for invisible "\0" char
    testInvalidFileNameMessage(
      '\0test\0test',
      'Invalid characters in name: "null"'
    );
  });

  it('rejects for reserved names', () => {
    testInvalidFileName('.');
    testInvalidFileName('..');
  });

  it('resolves for valid name', () => {
    testValidFileName('Currencies $ € 円 ₽ £ ₤');
    testValidFileName('Special chars , . * % # @ ↹ <>');
    testValidFileName('Iñtërnâtiônàližætiøn');
    testValidFileName('♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓');
    testValidFileName('name.extension');
    testValidFileName('name-no-extension');
    testValidFileName('.extension-no-name');
  });
});
