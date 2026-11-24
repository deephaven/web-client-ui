import { TestUtils } from '@deephaven/test-utils';
import { type ExpandableGridModel } from './ExpandableGridModel';
import { type BoxCoordinates, type GridMetrics } from './GridMetrics';
import GridRenderer from './GridRenderer';
import { type GridRenderState } from './GridRendererTypes';
import { type GridThemeType } from './GridTheme';
import TextCellRenderer from './TextCellRenderer';
import { MAX_HASHED_STRING_LENGTH } from './fastMemoize';

describe('getCachedTruncatedString', () => {
  const width = 200;
  const fontWidthLower = 4;
  const fontWidthUpper = 12;

  let context: CanvasRenderingContext2D;

  beforeEach(() => {
    context = TestUtils.createMockProxy<CanvasRenderingContext2D>({
      measureText: jest.fn(
        (text: string) => ({ width: text.length * 8 }) as TextMetrics
      ),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('truncates a very long text the same as the full text', () => {
    const text = `${'Lorem ipsum '.repeat(2000)}end`;
    expect(text.length).toBeGreaterThan(MAX_HASHED_STRING_LENGTH);

    const result = new TextCellRenderer().getCachedTruncatedString(
      context,
      text,
      width,
      fontWidthLower,
      fontWidthUpper
    );

    expect(result).toBe(
      GridRenderer.truncateToWidth(
        context,
        text,
        width,
        fontWidthLower,
        fontWidthUpper
      )
    );
    expect(result.endsWith('…')).toBe(true);
  });

  it('shares a cache entry between very long texts that only differ past what fits', () => {
    const truncateToWidth = jest.spyOn(GridRenderer, 'truncateToWidth');
    const renderer = new TextCellRenderer();
    const base = 'Lorem ipsum '.repeat(2000);

    const first = renderer.getCachedTruncatedString(
      context,
      `${base}1`,
      width,
      fontWidthLower,
      fontWidthUpper
    );
    const second = renderer.getCachedTruncatedString(
      context,
      `${base}2`,
      width,
      fontWidthLower,
      fontWidthUpper
    );

    expect(second).toBe(first);
    expect(truncateToWidth).toHaveBeenCalledTimes(1);
  });
});

describe('drawCellRowTreeMarker', () => {
  const row = 3;
  const treeBox: BoxCoordinates = { x1: 0, y1: 0, x2: 10, y2: 20 };

  function makeState(
    visibleRowTreeBoxes: Map<number, BoxCoordinates>
  ): GridRenderState {
    return TestUtils.createMockProxy<GridRenderState>({
      mouseX: null,
      mouseY: null,
      metrics: TestUtils.createMockProxy<GridMetrics>({
        firstColumn: 0,
        gridX: 0,
        gridY: 0,
        allColumnXs: new Map([[0, 0]]),
        allColumnWidths: new Map([[0, 100]]),
        allRowYs: new Map([[row, 60]]),
        allRowHeights: new Map([[row, 20]]),
        visibleRowTreeBoxes,
      }),
      model: TestUtils.createMockProxy<ExpandableGridModel>({
        hasExpandableRows: true,
        isRowExpandable: jest.fn(() => true),
        isRowExpanded: jest.fn(() => false),
      }),
      theme: TestUtils.createMockProxy<GridThemeType>({
        treeMarkerColor: 'marker',
        treeMarkerHoverColor: 'markerHover',
      }),
    });
  }

  it('draws a marker for rows with a tree box in the metrics', () => {
    const context =
      TestUtils.makeMockContext() as unknown as CanvasRenderingContext2D;
    new TextCellRenderer().drawCellRowTreeMarker(
      context,
      makeState(new Map([[row, treeBox]])),
      row
    );
    expect(context.fillText).toHaveBeenCalledWith('⊞', 5.5, 70.5);
  });

  it('skips rows the model reports expandable that the metrics have no tree box for', () => {
    const context =
      TestUtils.makeMockContext() as unknown as CanvasRenderingContext2D;
    expect(() =>
      new TextCellRenderer().drawCellRowTreeMarker(
        context,
        makeState(new Map()),
        row
      )
    ).not.toThrow();
    expect(context.fillText).not.toHaveBeenCalled();
  });
});
