import { ValidationError } from '@deephaven/utils';

/**
 * A basic list of some common MIME types.
 */
export enum MIME_TYPE {
  GROOVY = 'text/x-groovy',
  PLAIN_TEXT = 'text/plain',
  PYTHON = 'text/x-python',
  PYTHON_COMPILED = 'application/x-python-code',
  UNKNOWN = '',
}

/**
 * Collection of utils for operating on file names
 */
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
   * Get the depth (how many directories deep it is) of the provided filename with path.
   * @param name The full file name to get the depth of
   */
  static getDepth(name: string): number {
    if (!FileUtils.hasPath(name)) {
      throw new Error(`Invalid path provided: ${name}`);
    }
    const matches = name.match(/\//g) ?? [];
    return matches.length - 1;
  }

  /**
   * Get just the extension of file name.
   * Note that it just returns the last extension, so 'example.tar.gz' would just return 'gz'.
   * @param name The file name with or without path to get the extension of
   * @returns The file extension
   */
  static getExtension(name: string): string {
    const components = this.getBaseName(name).split('.');
    if (components.length > 1) {
      return components.pop() ?? '';
    }
    return '';
  }

  /**
   * Get the base name portion of the file, eg '/foo/bar.txt' => 'bar.txt'
   * @param name The full name including path of the file
   * @returns Just the file name part of the file
   */
  static getBaseName(name: string): string {
    return name.split('/').pop() ?? '';
  }

  /**
   * Return a MIME type for the provided file
   * @param name The file name to get the type for
   * @returns A known MIME type if recognized
   */
  static getMimeType(name: string): MIME_TYPE {
    const basename = this.getBaseName(name).toLowerCase();
    switch (basename) {
      case 'groovy':
        return MIME_TYPE.GROOVY;
      case 'py':
        return MIME_TYPE.PYTHON;
      case 'pyc':
        return MIME_TYPE.PYTHON_COMPILED;
      case 'txt':
        return MIME_TYPE.PLAIN_TEXT;
      default:
        return MIME_TYPE.UNKNOWN;
    }
  }

  /**
   * Pop the last part of the filename component to return the parent path
   * @param name The file name to get the parent path of
   */
  static getParent(name: string): string {
    if (!FileUtils.hasPath(name)) {
      throw new Error(`Invalid name provided: ${name}`);
    }

    const parts = name.split('/');
    while (parts.pop() === '');
    if (parts.length === 0) {
      throw new Error(`No parent for path provided: ${name}`);
    }
    return `${parts.join('/')}/`;
  }

  /**
   * Get the path name portion of the file
   * @param name The full path with or without filename to get the path of
   * @returns Just the path with out the file name part, including trailing slash
   */
  static getPath(name: string): string {
    if (!FileUtils.hasPath(name)) {
      throw new Error(`Invalid filename provided: ${name}`);
    }
    const parts = name.split('/');
    parts.pop();
    return `${parts.join('/')}/`;
  }

  /**
   * Check if a given file name includes the full path
   * @param name The file name to check
   * @returns True if it's a full path, false otherwise
   */
  static hasPath(name: string): boolean {
    return name.startsWith('/');
  }

  /**
   * Check a given file name is a path
   * @param name The file name to check
   * @returns True if it's a full path, false otherwise
   */
  static isPath(name: string): boolean {
    return name.startsWith('/') && name.endsWith('/');
  }

  /**
   * Turns a directory file name into a path. Basically ensures there's a trailing slash
   * @param name The directory name to make a path
   */
  static makePath(name: string): string {
    if (!name.endsWith('/')) {
      return `${name}/`;
    }
    return name;
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

  /**
   * Validate the provided name. Throws an error if validation fails
   * @param name The item name to validate
   */
  static validateName(name: string): void {
    // Static checks
    const reservedNames = ['.', '..'];
    // Global flag to show all invalid chars, not just the first match
    const invalidCharsRegex = /[\\/\0]/g;
    const invalidCharLabels = new Map([['\0', 'null']]);

    if (!name) {
      throw new ValidationError(`Name cannot be empty`);
    }
    if (reservedNames.includes(name)) {
      throw new ValidationError(`"${name}" is a reserved name`);
    }
    if (invalidCharsRegex.test(name)) {
      throw new ValidationError(
        `Invalid characters in name: "${(name.match(invalidCharsRegex) ?? [])
          // Filter out duplicates
          .reduce(
            (acc, next) => (acc.includes(next) ? acc : [...acc, next]),
            [] as string[]
          )
          .map(char =>
            invalidCharLabels.has(char) ? invalidCharLabels.get(char) : char
          )
          .join('", "')}"`
      );
    }
  }
}

export default FileUtils;
