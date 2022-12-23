import {
  MoveOperation,
  GridUtils,
  ModelIndex,
  BoundedAxisRange,
  IColumnHeaderGroup,
} from '@deephaven/grid';
import memoizeOne from 'memoize-one';
import Log from '@deephaven/log';

const log = Log.module('ColumnHeaderGroup');

export function isColumnHeaderGroup(x: unknown): x is ColumnHeaderGroup {
  return x instanceof ColumnHeaderGroup;
}

export default class ColumnHeaderGroup implements IColumnHeaderGroup {
  static NEW_GROUP_PREFIX = ':newGroup';

  name: string;

  children: string[];

  depth: number;

  parent?: ColumnHeaderGroup;

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
        log.warn(`Column header group ${this.name} is not contiguous`);
      }

      return [start, end];
    }
  );

  setParent(parent: ColumnHeaderGroup | undefined): void {
    this.parent = parent;
  }

  addChildren(children: string[]): void {
    const newChildren = new Set(this.children.concat(children));
    this.children = [...newChildren];
  }

  removeChildren(children: string[]): void {
    const newChildren = new Set(this.children);
    children.forEach(name => newChildren.delete(name));
    this.children = [...newChildren];
  }

  get isNew(): boolean {
    return this.name.startsWith(ColumnHeaderGroup.NEW_GROUP_PREFIX);
  }
}
