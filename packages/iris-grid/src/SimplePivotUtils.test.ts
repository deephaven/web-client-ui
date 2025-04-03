import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  PIVOT_COLUMN_PREFIX,
  isColumnMapComplete,
  type SimplePivotColumnMap,
} from './SimplePivotUtils';

describe('isColumnMapComplete', () => {
  it('returns true if all PIVOT_C_ columns exist in the map', () => {
    const mockColumns = [
      { name: `${PIVOT_COLUMN_PREFIX}A` } as DhType.Column,
      { name: `${PIVOT_COLUMN_PREFIX}B` } as DhType.Column,
    ];
    const mockColumnMap: SimplePivotColumnMap = new Map([
      [`${PIVOT_COLUMN_PREFIX}A`, 'ValA'],
      [`${PIVOT_COLUMN_PREFIX}B`, 'ValB'],
    ]);

    const result = isColumnMapComplete(mockColumnMap, mockColumns);
    expect(result).toBe(true);
  });

  it('returns false if a pivot column is missing in the map', () => {
    const mockColumns = [
      { name: `${PIVOT_COLUMN_PREFIX}A` } as DhType.Column,
      { name: `${PIVOT_COLUMN_PREFIX}B` } as DhType.Column,
    ];
    const mockColumnMap: SimplePivotColumnMap = new Map([
      [`${PIVOT_COLUMN_PREFIX}A`, 'ValA'],
    ]);

    const result = isColumnMapComplete(mockColumnMap, mockColumns);
    expect(result).toBe(false);
  });

  it('ignores non-pivot columns when checking completeness', () => {
    const mockColumns = [
      { name: 'RandomColumn' } as DhType.Column,
      { name: `${PIVOT_COLUMN_PREFIX}A` } as DhType.Column,
    ];
    const mockColumnMap: SimplePivotColumnMap = new Map([
      [`${PIVOT_COLUMN_PREFIX}A`, 'ValA'],
    ]);

    const result = isColumnMapComplete(mockColumnMap, mockColumns);
    expect(result).toBe(true);
  });
});
