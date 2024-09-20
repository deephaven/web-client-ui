import { ValidationError } from '@deephaven/utils';
import { type FileStorageItem } from './FileStorage';

class FileExistsError extends ValidationError {
  isExistingFile = true;

  info: FileStorageItem;

  constructor(info: FileStorageItem) {
    super('Name already exists');
    this.info = info;
  }
}

export default FileExistsError;
