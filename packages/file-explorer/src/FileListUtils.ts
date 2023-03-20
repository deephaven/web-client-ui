import { isDirectory } from './FileStorage';
import type { FileStorageItem } from './FileStorage';
import FileUtils from './FileUtils';

export const DEFAULT_ROW_HEIGHT = 26;

export function getPathFromItem(file: FileStorageItem): string {
  return isDirectory(file)
    ? FileUtils.makePath(file.filename)
    : FileUtils.getPath(file.filename);
}

/**
 * Get the move operation for the current selection and the given target. Throws if the operation is invalid.
 */
export function getMoveOperation(
  draggedItems: FileStorageItem[],
  targetItem: FileStorageItem
): { files: FileStorageItem[]; targetPath: string } {
  if (draggedItems.length === 0 || targetItem == null) {
    throw new Error('No items to move');
  }

  const targetPath = getPathFromItem(targetItem);
  if (
    draggedItems.some(
      ({ filename }) => FileUtils.getPath(filename) === targetPath
    )
  ) {
    // Cannot drop if target is one of the dragged items is already in the target folder
    throw new Error('File already in the destination folder');
  }
  if (
    draggedItems.some(
      item =>
        isDirectory(item) &&
        targetPath.startsWith(FileUtils.makePath(item.filename))
    )
  ) {
    // Cannot drop if target is a child of one of the directories being moved
    throw new Error('Destination folder cannot be a child of a dragged folder');
  }
  return { files: draggedItems, targetPath };
}
