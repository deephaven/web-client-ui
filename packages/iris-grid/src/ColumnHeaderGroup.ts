import {
  MoveOperation,
  GridUtils,
  ModelIndex,
  BoundedAxisRange,
  IColumnHeaderGroup,
} from '@deephaven/grid';
import memoizeOne from 'memoize-one';

export function isColumnHeaderGroup(x: unknown): x is ColumnHeaderGroup {
  return x instanceof ColumnHeaderGroup;
}

export default class ColumnHeaderGroup implements IColumnHeaderGroup {
  name: string;

  children: string[];

  depth: number;

  color?: string;

  childIndexes: (ModelIndex | ModelIndex[])[];

  constructor({
    name,
    children,
    color,
    depth,
    childIndexes,
  }: {
    name: string;
    children: string[];
    color?: string;
    depth: number;
    childIndexes: (ModelIndex | ModelIndex[])[];
  }) {
    this.name = name;
    this.children = children;
    this.color = color;
    this.depth = depth;
    this.childIndexes = childIndexes;
  }

  getVisibleRange = memoizeOne(
    (movedItems: MoveOperation[]): BoundedAxisRange => {
      const flattenedIndexes = this.childIndexes.flat();
      const visibleIndexes = GridUtils.getVisibleIndexes(
        flattenedIndexes,
        movedItems
      );

      const start = Math.min(...visibleIndexes);
      const end = Math.max(...visibleIndexes);

      if (end - start !== flattenedIndexes.length - 1) {
        throw new Error(`Column header group ${this.name} is not contiguous`);
      }

      return [start, end];
    }
  );
}
