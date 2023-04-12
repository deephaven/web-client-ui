import { MoveOperation, BoundedAxisRange } from './GridTypes';

export interface IColumnHeaderGroup {
  name: string;
  depth: number;
  color?: string;
  getVisibleRange(movedColumns: readonly MoveOperation[]): BoundedAxisRange;
}
