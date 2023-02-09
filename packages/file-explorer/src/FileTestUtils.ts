import { DirectoryStorageItem, FileStorageItem } from './FileStorage';

/**
 * Make a file name with prefix 'testfile'
 * @param index Number of the file
 * @returns A string with prefix 'testfile' followed by index
 */
export function makeFileName(index = 0): string {
  return `testfile${index}`;
}

/**
 * Make a directory name with prefix 'testdir'
 * @param index Number of the directory
 * @returns A string with prefix 'testdir' followed by index
 */
export function makeDirName(index = 0): string {
  return `testdir${index}`;
}

/**
 * Make a file object
 * @param basename The basename of the file
 * @param path The path of the file
 * @returns A FileStorageItem object
 */
export function makeFile(basename: string, path = '/'): FileStorageItem {
  const filename = `${path}${basename}`;
  return {
    basename,
    filename,
    type: 'file',
    id: filename,
  };
}

/**
 * Make files from 0 to and not including count
 * @param count The number of files to create (0 to count - 1). Defaults to 5
 * @returns An array of FileStorageItems
 */
export function makeFiles(count = 5) {
  const result: FileStorageItem[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(makeFile(makeFileName(i)));
  }
  return result;
}

/**
 * Make a directory object
 * @param basename The basename of the directory
 * @param path The path of the directory
 * @returns A DirectoryStorageItem object
 */
export function makeDirectory(
  basename: string,
  path = '/'
): DirectoryStorageItem {
  const filename = `${path}${basename}`;
  return {
    basename,
    filename,
    type: 'directory',
    id: filename,
    isExpanded: false,
  };
}

/**
 * Make directories from 0 to and not including count
 * @param count The number of directories to create (0 to count - 1). Defaults to 5
 * @returns An array of DirectoryStorageItems
 */
export function makeDirectories(count = 5) {
  const result: DirectoryStorageItem[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(makeDirectory(`testdir${i}`));
  }
  return result;
}

/**
 * Make a nested file
 * @param directories The nested directories in order
 * @param fileNum Number of the file
 * @returns A FileStorageItem
 */
export function makeNested(
  directories: number[],
  fileNum: number
): FileStorageItem {
  const basename = `/${directories
    .map(directory => makeDirName(directory))
    .join('/')}/`;
  return makeFile(makeFileName(fileNum), basename);
}

export default {
  makeFileName,
  makeFile,
  makeFiles,
  makeDirName,
  makeDirectory,
  makeDirectories,
  makeNested,
};
