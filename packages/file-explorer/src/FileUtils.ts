export class FileUtils {
  /**
   * Format file extension
   * @param extension File extension to format, defaults to empty string
   * @returns Formatted string - '' for no extension, '.' for empty extension, '.ext' for non-empty extension
   */
  static fileExtensionToString(extension = ''): string {
    return extension.length === 0 ? '' : `.${extension}`;
  }

  /**
   * Focus rename input and select name part for files, select all text for folders
   * @param input Input element to select text in
   * @param isFolder True if the input value is a folder name
   */
  static focusRenameInput(input: HTMLInputElement, isFolder = false): void {
    const { value } = input;
    const selectionEnd = isFolder ? value.length : value.lastIndexOf('.');
    input.focus();
    input.setSelectionRange(0, selectionEnd > 0 ? selectionEnd : value.length);
  }

  /**
   * Get just the extension of file name.
   * Note that it just returns the last extension, so 'example.tar.gz' would just return 'gz'.
   * @param name The file name with or without path to get the extension of
   * @returns The file extension
   */
  static getExtension(name: string): string {
    return name.split('.').pop() ?? '';
  }

  /**
   * Get the path name portion of the file
   * @param name The full path with or without filename to get the path of
   * @returns Just the path with out the file name part, including trailing slash
   */
  static getPath(name: string): string {
    const parts = name.split('/');
    parts.pop();
    return `${parts.join('/')}/`;
  }

  /**
   * Get the file name portion of the file
   * @param name The full name including path of the file
   * @returns Just the file name part of the file
   */
  static getFileName(name: string): string {
    return name.split('/').pop() ?? '';
  }

  /**
   * Check if a given file name includes the full path
   * @param name The file name to check
   * @returns True if it's a full path, false otherwise
   */
  static isFullPath(name: string): boolean {
    return name.startsWith('/');
  }

  /**
   * Replace extension in the item name
   * @param name Name to replace the extension in
   * @param newExtension New extension, defaults to no extension
   */
  static replaceExtension(name: string, newExtension = ''): string {
    const index = name.lastIndexOf('.');
    const nameWithoutExtension = index > -1 ? name.substring(0, index) : name;
    const extensionString = FileUtils.fileExtensionToString(newExtension);
    return `${nameWithoutExtension}${extensionString}`;
  }
}

export default FileUtils;
