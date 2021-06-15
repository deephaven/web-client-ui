export class FileUtils {
  static getExtension(name: string): string {
    return name.split('.').pop() ?? '';
  }

  static getFileName(fullPath: string): string {
    return fullPath.split('/').pop() ?? '';
  }
}

export default FileUtils;
