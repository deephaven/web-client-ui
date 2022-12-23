/* eslint-disable import/prefer-default-export */
import {
  closestCorners,
  getFirstCollision,
  KeyboardCode,
  KeyboardCoordinateGetter,
  DroppableContainer,
} from '@dnd-kit/core';
import type { SensorContext } from './types';
import { getProjection } from './utilities';

const DIRECTIONS: string[] = [
  KeyboardCode.Down,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Left,
];

const HORIZONTAL: string[] = [KeyboardCode.Left, KeyboardCode.Right];

export function sortableTreeKeyboardCoordinates(
  context: SensorContext,
  indicator: boolean,
  indentationWidth: number
): KeyboardCoordinateGetter {
  return (
    event,
    {
      currentCoordinates,
      context: {
        active,
        over,
        collisionRect,
        droppableRects,
        droppableContainers,
      },
    }
  ) => {
    if (DIRECTIONS.includes(event.code)) {
      if (!active || !collisionRect) {
        return;
      }

      event.preventDefault();

      const {
        current: { items, offset },
      } = context;

      if (HORIZONTAL.includes(event.code) && over?.id != null) {
        const { depth, maxDepth, minDepth } = getProjection(
          items,
          active.id as string,
          over.id as string,
          offset,
          indentationWidth
        );

        switch (event.code) {
          case KeyboardCode.Left:
            if (depth > minDepth) {
              return {
                ...currentCoordinates,
                x: currentCoordinates.x - indentationWidth,
              };
            }
            break;
          case KeyboardCode.Right:
            if (depth < maxDepth) {
              return {
                ...currentCoordinates,
                x: currentCoordinates.x + indentationWidth,
              };
            }
            break;
        }

        return undefined;
      }

      const containers: DroppableContainer[] = [];

      droppableContainers.forEach(container => {
        if (container?.disabled || container.id === over?.id) {
          return;
        }

        const rect = droppableRects.get(container.id);

        if (!rect) {
          return;
        }

        switch (event.code) {
          case KeyboardCode.Down:
            if (collisionRect.top < rect.top) {
              containers.push(container);
            }
            break;
          case KeyboardCode.Up:
            if (collisionRect.top > rect.top) {
              containers.push(container);
            }
            break;
        }
      });

      const collisions = closestCorners({
        active,
        collisionRect,
        pointerCoordinates: null,
        droppableRects,
        droppableContainers: containers,
      });
      let closestId = getFirstCollision(collisions, 'id');

      if (closestId === over?.id && collisions.length > 1) {
        closestId = collisions[1].id;
      }

      if (closestId != null && over?.id != null) {
        const activeRect = droppableRects.get(active.id);
        const newRect = droppableRects.get(closestId);
        const newDroppable = droppableContainers.get(closestId);

        if (activeRect && newRect && newDroppable) {
          const newIndex = items.findIndex(({ id }) => id === closestId);
          const newItem = items[newIndex];
          const activeIndex = items.findIndex(({ id }) => id === active.id);
          const activeItem = items[activeIndex];

          if (newItem != null && activeItem != null) {
            const { depth } = getProjection(
              items,
              active.id as string,
              closestId as string,
              (newItem.depth - activeItem.depth) * indentationWidth,
              indentationWidth
            );
            const isBelow = newIndex > activeIndex;
            const modifier = isBelow ? 1 : -1;
            const nextOffset = indicator
              ? (collisionRect.height - activeRect.height) / 2
              : 0;

            const newCoordinates = {
              x: newRect.left + depth * indentationWidth,
              y: newRect.top + modifier * nextOffset,
            };

            return newCoordinates;
          }
        }
      }
    }

    return undefined;
  };
}
