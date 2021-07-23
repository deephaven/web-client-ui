import { FileStorageItem } from './FileStorage';
import { getMoveOperation } from './FileList';

describe('getMoveOperation', () => {
  function makeFile(basename: string, path = '/'): FileStorageItem {
    const filename = `${path}${basename}`;
    return {
      basename,
      filename,
      type: 'file',
      id: filename,
    };
  }

  function makeDirectory(name: string, path = '/'): FileStorageItem {
    const file = makeFile(name, path);
    file.type = 'directory';
    return file;
  }

  it('succeeds if moving files from root to within a directory', () => {
    const targetPath = '/target/';
    const targetDirectory = makeDirectory('target');
    const targetItem = makeFile('targetItem', targetPath);
    const draggedItems = [makeFile('foo.txt'), makeFile('bar.txt')];
    expect(getMoveOperation(draggedItems, targetItem)).toEqual({
      files: draggedItems,
      targetPath,
    });
    expect(getMoveOperation(draggedItems, targetDirectory)).toEqual({
      files: draggedItems,
      targetPath,
    });
  });

  it('succeeds moving files from directory into root', () => {
    const targetPath = '/';
    const targetItem = makeFile('targetItem', targetPath);
    const path = '/baz/';
    const draggedItems = [makeFile('foo.txt', path), makeFile('bar.txt', path)];
    expect(getMoveOperation(draggedItems, targetItem)).toEqual({
      files: draggedItems,
      targetPath,
    });
  });

  it('fails if no items selected to move', () => {
    expect(() => getMoveOperation([], makeFile('foo.txt'))).toThrow();
  });

  it('fails if trying to move files within same directory', () => {
    const path = '/baz/';
    const targetItem = makeFile('targetItem', path);
    const draggedItems = [makeFile('foo.txt', path), makeFile('bar.txt')];
    expect(() => getMoveOperation(draggedItems, targetItem)).toThrow();
  });

  it('fails to move a directory into a child directory', () => {
    expect(() =>
      getMoveOperation([makeDirectory('foo')], makeDirectory('bar', '/foo/'))
    ).toThrow();
  });
});
