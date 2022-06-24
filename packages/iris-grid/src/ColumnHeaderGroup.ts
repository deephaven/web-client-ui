import { MoveOperation, AxisRange } from '@deephaven/grid';

export default class ColumnHeaderGroup {
  name: string;

  children: string[];

  color?: string;

  private movedItems: MoveOperation[] = [];

  constructor({
    name,
    children,
    color,
  }: {
    name: string;
    children: string[];
    color?: string;
  }) {
    this.name = name;
    this.children = children;
    this.color = color;
  }

  // getVisibleRange(movedItems: MoveOperation[]): AxisRange {

  // }
}
