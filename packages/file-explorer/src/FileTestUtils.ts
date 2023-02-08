import { DirectoryStorageItem, FileStorageItem } from './FileStorage';

class FileTestUtils {
  /**
   * Make a file name with prefix 'testfile'
   * @param index Number of the file
   * @returns A string with prefix 'testfile' followed by index
   */
  static makeFileName(index = 0): string {
    return `testfile${index}`;
  }

  /**
   * Make a directory name with prefix 'testdir'
   * @param index Number of the directory
   * @returns A string with prefix 'testdir' followed by index
   */
  static makeDirName(index = 0): string {
    return `testdir${index}`;
  }

  /**
   * Make a file object
   * @param basename The basename of the file
   * @param path The path of the file
   * @returns A FileStorageItem object
   */
  static makeFile(basename: string, path = '/'): FileStorageItem {
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
  static makeFiles(count = 5) {
    const result: FileStorageItem[] = [];
    for (let i = 0; i < count; i += 1) {
      result.push(FileTestUtils.makeFile(FileTestUtils.makeFileName(i)));
    }
    return result;
  }

  /**
   * Make a directory object
   * @param basename The basename of the directory
   * @param path The path of the directory
   * @returns A DirectoryStorageItem object
   */
  static makeDirectory(basename: string, path = '/'): DirectoryStorageItem {
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
  static makeDirectories(count = 5) {
    const result: DirectoryStorageItem[] = [];
    for (let i = 0; i < count; i += 1) {
      result.push(FileTestUtils.makeDirectory(`testdir${i}`));
    }
    return result;
  }

  /**
   * Make a nested file
   * @param directories The nested directories in order
   * @param fileNum Number of the file
   * @returns A FileStorageItem
   */
  static makeNested(directories: number[], fileNum: number): FileStorageItem {
    const basename = `/${directories
      .map(directory => FileTestUtils.makeDirName(directory))
      .join('/')}/`;
    return FileTestUtils.makeFile(
      FileTestUtils.makeFileName(fileNum),
      basename
    );
  }
}

export default FileTestUtils;
