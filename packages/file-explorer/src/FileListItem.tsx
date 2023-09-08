import React from 'react';
import { Tooltip, RenderItemProps } from '@deephaven/components';
import { dhPython, vsCode, vsFolder, vsFolderOpened } from '@deephaven/icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { FileStorageItem, isDirectory } from './FileStorage';
import './FileList.scss';
import FileUtils, { MIME_TYPE } from './FileUtils';
import { getPathFromItem } from './FileListUtils';

/**
 * Get the icon definition for a file or folder item
 * @param item Item to get the icon for
 * @returns Icon definition to pass in the FontAwesomeIcon icon prop
 */
function getItemIcon(item: FileStorageItem): IconDefinition {
  if (isDirectory(item)) {
    return item.isExpanded ? vsFolderOpened : vsFolder;
  }
  const mimeType = FileUtils.getMimeType(item.basename);
  switch (mimeType) {
    case MIME_TYPE.PYTHON:
      return dhPython;
    default:
      return vsCode;
  }
}

export type FileListRenderItemProps = RenderItemProps<FileStorageItem> & {
  children?: JSX.Element;
  dropTargetItem?: FileStorageItem;
  draggedItems?: FileStorageItem[];
  isDragInProgress: boolean;
  isDropTargetValid: boolean;

  onDragStart(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDragOver(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDragEnd(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDrop(index: number, e: React.DragEvent<HTMLDivElement>): void;
};

export function FileListItem(props: FileListRenderItemProps): JSX.Element {
  const {
    children,
    draggedItems,
    isDragInProgress,
    isDropTargetValid,
    isSelected,
    item,
    itemIndex,
    dropTargetItem,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
  } = props;

  const isDragged =
    draggedItems?.some(draggedItem => draggedItem.id === item.id) ?? false;
  const itemPath = getPathFromItem(item);
  const dropTargetPath =
    isDragInProgress && dropTargetItem ? getPathFromItem(dropTargetItem) : null;

  const isExactDropTarget =
    isDragInProgress &&
    isDropTargetValid &&
    isDirectory(item) &&
    dropTargetPath === itemPath;
  const isInDropTarget =
    isDragInProgress && isDropTargetValid && dropTargetPath === itemPath;
  const isInvalidDropTarget =
    isDragInProgress && !isDropTargetValid && dropTargetPath === itemPath;

  const icon = getItemIcon(item);
  const depth = FileUtils.getDepth(item.filename);
  const depthLines = Array(depth)
    .fill(null)
    .map((value, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <span className="file-list-depth-line" key={index} />
    ));

  return (
    <div
      className={classNames(
        'd-flex w-100 align-items-center',
        'file-list-item',
        {
          'is-dragged': isDragged,
          'is-exact-drop-target': isExactDropTarget,
          'is-in-drop-target': isInDropTarget,
          'is-invalid-drop-target': isInvalidDropTarget,
          'is-selected': isSelected,
        }
      )}
      onDragStart={e => onDragStart(itemIndex, e)}
      onDragOver={e => onDragOver(itemIndex, e)}
      onDragEnd={e => onDragEnd(itemIndex, e)}
      onDrop={e => onDrop(itemIndex, e)}
      draggable
      role="presentation"
      aria-label={item.basename}
    >
      {depthLines}{' '}
      <FontAwesomeIcon icon={icon} className="item-icon" fixedWidth />{' '}
      <span className="truncation-wrapper">
        {children ?? (
          <>
            {item.basename}
            <Tooltip>{item.basename}</Tooltip>
          </>
        )}
      </span>
    </div>
  );
}

export default FileListItem;
