import { ValidationError } from '@deephaven/utils';

class FileExistsError extends ValidationError {
  constructor() {
    super('Name already exists');
  }

  isExistingFile = true;
}

export default FileExistsError;
