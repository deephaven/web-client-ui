import type { MutableRefObject } from 'react';

export type TreeItem<T = undefined> = {
  id: string;
  children: TreeItem<T>[];
  selected: boolean;
} & (T extends undefined
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : {
      data: T;
    });

export type TreeItems<T = undefined> = TreeItem<T>[];

export type FlattenedItem<T = undefined> = TreeItem<T> & {
  parentId: string | null;
  depth: number;
  index: number;
};

export function isFlattenedTreeItem<T>(
  item: TreeItem<T>
): item is FlattenedItem<T> {
  return (item as FlattenedItem<T>).parentId !== undefined;
}

export type SensorContext = MutableRefObject<{
  items: FlattenedItem[];
  offset: number;
}>;
