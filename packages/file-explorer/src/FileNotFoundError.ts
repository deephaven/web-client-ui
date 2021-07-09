class FileNotFoundError extends Error {
  constructor() {
    super('No file exists at the path specified');
  }

  isFileNotFound = true;
}

export default FileNotFoundError;
