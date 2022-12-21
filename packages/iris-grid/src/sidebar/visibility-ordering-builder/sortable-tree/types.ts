import type { MutableRefObject } from 'react';

export type TreeItem<T = undefined> = {
  id: string;
  children: TreeItem<T>[];
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

export type SensorContext = MutableRefObject<{
  items: FlattenedItem[];
  offset: number;
}>;
