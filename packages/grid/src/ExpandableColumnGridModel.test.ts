import { isExpandableColumnGridModel } from './ExpandableColumnGridModel';
import type GridModel from './GridModel';
import type ExpandableColumnGridModel from './ExpandableColumnGridModel';

describe('ExpandableColumnGridModel', () => {
  describe('isExpandableColumnGridModel', () => {
    it('should return true for model with hasExpandableColumns property', () => {
      const model = {
        hasExpandableColumns: true,
      } as ExpandableColumnGridModel;

      expect(isExpandableColumnGridModel(model)).toBe(true);
    });

    it('should return true when hasExpandableColumns is false', () => {
      const model = {
        hasExpandableColumns: false,
      } as ExpandableColumnGridModel;

      expect(isExpandableColumnGridModel(model)).toBe(true);
    });

    it('should return false for model without hasExpandableColumns property', () => {
      const model = {} as GridModel;

      expect(isExpandableColumnGridModel(model)).toBe(false);
    });
  });
});
