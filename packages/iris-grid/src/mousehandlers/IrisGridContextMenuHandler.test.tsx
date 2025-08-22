import { TestUtils } from '@deephaven/utils';
import {
  ExpandableColumnGridModel,
  isExpandableColumnGridModel,
  type GridPoint,
  type ModelIndex,
} from '@deephaven/grid';
import { dh } from '@deephaven/jsapi-types';
import { ContextActionUtils } from '@deephaven/components';
import IrisGridContextMenuHandler from './IrisGridContextMenuHandler';
import IrisGrid, { IrisGridProps } from '../IrisGrid';
import IrisGridModel from '../IrisGridModel';

jest.mock('@deephaven/grid', () => ({
  ...jest.requireActual('@deephaven/grid'),
  isExpandableColumnGridModel: jest.fn(),
}));

const { asMock, createMockProxy } = TestUtils;

describe('IrisGridContextMenuHandler', () => {
  const mockDh = createMockProxy<typeof dh>();
  let irisGrid: IrisGrid;
  let handler: IrisGridContextMenuHandler;

  beforeEach(() => {
    irisGrid = createMockProxy<IrisGrid>({
      props: createMockProxy<IrisGridProps>({
        model: createMockProxy<IrisGridModel & ExpandableColumnGridModel>({
          hasExpandableColumns: true,
        }),
      }),
    });

    handler = new IrisGridContextMenuHandler(irisGrid, mockDh);
  });

  describe('getHeaderActions', () => {
    const mockGridPoint: GridPoint = {
      column: 0 as ModelIndex,
      row: null,
      x: 0,
      y: 0,
      columnHeaderDepth: 0,
    };

    it('includes expand/collapse actions for expandable columns', () => {
      const modelIndex = 0;

      asMock(isExpandableColumnGridModel).mockReturnValue(true);
      const menuItems = ContextActionUtils.getMenuItems(
        handler.getHeaderActions(modelIndex, mockGridPoint),
        false
      );

      expect(menuItems.some(a => a.title === 'Expand All')).toBeTruthy();
      expect(menuItems.some(a => a.title === 'Collapse All')).toBeTruthy();
    });

    it('does not include expand/collapse actions for non-expandable columns', () => {
      const modelIndex = 0;

      asMock(isExpandableColumnGridModel).mockReturnValue(false);
      const menuItems = ContextActionUtils.getMenuItems(
        handler.getHeaderActions(modelIndex, mockGridPoint),
        false
      );

      expect(menuItems.some(a => a.title === 'Expand All')).toBeFalsy();
      expect(menuItems.some(a => a.title === 'Collapse All')).toBeFalsy();
    });
  });
});
