import { TestUtils } from '@deephaven/utils';
import {
  ExpandableColumnGridModel,
  GridMetrics,
  type GridPoint,
  type ModelIndex,
} from '@deephaven/grid';
import { dh } from '@deephaven/jsapi-types';
import { ContextActionUtils } from '@deephaven/components';
import IrisGridContextMenuHandler from './IrisGridContextMenuHandler';
import IrisGrid, { IrisGridProps, IrisGridState } from '../IrisGrid';
import IrisGridModel from '../IrisGridModel';
import { IrisGridThemeType } from '../IrisGridTheme';

const { createMockProxy } = TestUtils;

function makeColumns(count = 5): dh.Column[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProxy<dh.Column>({
      name: `Column${i + 1}`,
      type: 'java.lang.String',
    })
  );
}

function makeMockModel({
  columns = makeColumns(),
  hasExpandableColumns = true,
  isExpandAllColumnsAvailable = true,
}: {
  columns?: readonly dh.Column[];
  hasExpandableColumns?: boolean;
  isExpandAllColumnsAvailable?: boolean;
} = {}): IrisGridModel & ExpandableColumnGridModel {
  return createMockProxy<IrisGridModel & ExpandableColumnGridModel>({
    hasExpandableColumns,
    isExpandAllColumnsAvailable,
    columns,
    isColumnExpandable: jest.fn(() => true),
    isColumnExpanded: jest.fn(() => false),
  });
}

function makeMockIrisGrid({
  model = makeMockModel(),
  theme = createMockProxy<IrisGridThemeType>({}),
}: {
  model?: IrisGridModel & ExpandableColumnGridModel;
  theme?: IrisGridThemeType;
} = {}): IrisGrid {
  return createMockProxy<IrisGrid>({
    props: createMockProxy<IrisGridProps>({
      model,
      theme,
    }),
    state: createMockProxy<IrisGridState>({
      metrics: createMockProxy<GridMetrics>({
        userColumnWidths: new Map(
          model.columns.map((_col, index) => [index, 100] as [number, number])
        ),
      }),
      advancedFilters: new Map(),
      quickFilters: new Map(),
    }),
    getTheme: jest.fn().mockReturnValue(theme),
  });
}

describe('getHeaderActions', () => {
  const mockDh = createMockProxy<typeof dh>();
  const mockGridPoint: GridPoint = {
    column: 0 as ModelIndex,
    row: null,
    x: 0,
    y: 0,
    columnHeaderDepth: 0,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false],
  ])(
    'shows correct actions when hasExpandableColumns=%s, isExpandAllColumnsAvailable=%s',
    (
      hasExpandableColumns,
      isExpandAllColumnsAvailable,
      shouldShowExpandCollapseAll
    ) => {
      const model = makeMockModel({
        hasExpandableColumns,
        isExpandAllColumnsAvailable,
      });
      const handler = new IrisGridContextMenuHandler(
        makeMockIrisGrid({ model }),
        mockDh
      );
      const menuItems = ContextActionUtils.getMenuItems(
        handler.getHeaderActions(0, mockGridPoint),
        false
      );

      expect(menuItems.some(a => a.title === 'Expand All Columns')).toBe(
        shouldShowExpandCollapseAll
      );
      expect(menuItems.some(a => a.title === 'Collapse All Columns')).toBe(
        shouldShowExpandCollapseAll
      );
    }
  );
});
