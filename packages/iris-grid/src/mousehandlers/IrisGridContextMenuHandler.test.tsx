import type React from 'react';
import { TestUtils } from '@deephaven/test-utils';
import {
  type ExpandableColumnGridModel,
  type Grid,
  type GridMetrics,
  type GridPoint,
  GridSelectionMouseHandler,
  type ModelIndex,
} from '@deephaven/grid';
import { type dh } from '@deephaven/jsapi-types';
import { ContextActions, ContextActionUtils } from '@deephaven/components';
import IrisGridContextMenuHandler from './IrisGridContextMenuHandler';
import {
  type default as IrisGrid,
  type IrisGridProps,
  type IrisGridState,
} from '../IrisGrid';
import type IrisGridModel from '../IrisGridModel';
import { type IrisGridThemeType } from '../IrisGridTheme';

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
    getColumnIndexByName: jest.fn((name: string) =>
      columns.find(col => col.name === name)
    ),
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
        gridY: 0,
      }),
      advancedFilters: new Map(),
      quickFilters: new Map(),
      columnAlignmentMap: new Map(),
    }),
    getTheme: jest.fn().mockReturnValue(theme),
  });
}

describe('onContextMenu modelRow prop', () => {
  const mockDh = createMockProxy<typeof dh>();

  beforeEach(() => {
    jest
      .spyOn(GridSelectionMouseHandler, 'getLatestSelection')
      .mockReturnValue([]);
    jest.spyOn(ContextActions, 'triggerMenu').mockImplementation(() => null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['defined', 5 as ModelIndex],
    ['undefined', undefined],
    ['null', null],
  ])('is called when modelRow is %s', (_label, modelRowValue) => {
    const columns = makeColumns();
    const model = makeMockModel({ columns });
    (model.sourceForCell as jest.Mock).mockReturnValue({ column: 0, row: 0 });

    const irisGrid = makeMockIrisGrid({ model });
    const mockOnContextMenu = irisGrid.props.onContextMenu as jest.Mock;
    mockOnContextMenu.mockReturnValue([]);
    (irisGrid.getModelColumn as jest.Mock).mockReturnValue(0);
    (irisGrid.getModelRow as jest.Mock).mockReturnValue(modelRowValue);

    const handler = new IrisGridContextMenuHandler(irisGrid, mockDh);

    const gridPoint: GridPoint = {
      column: 0 as ModelIndex,
      row: null,
      x: 0,
      y: 1000,
      columnHeaderDepth: 0,
    };

    handler.onContextMenu(gridPoint, createMockProxy<Grid>(), {
      clientX: 0,
      clientY: 0,
    } as React.MouseEvent<Element, MouseEvent>);

    expect(mockOnContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        model,
        column: columns[0],
        rowIndex: null,
        columnIndex: 0,
        modelRow: modelRowValue,
        modelColumn: 0,
      })
    );
  });
});

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
