import { MoveOperation } from './GridMetrics';
import { BoundedAxisRange } from './GridAxisRange';

export interface IColumnHeaderGroup {
  name: string;
  depth: number;
  color?: string;
  getVisibleRange: (movedColumns: readonly MoveOperation[]) => BoundedAxisRange;
}
