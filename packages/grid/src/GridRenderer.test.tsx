import type GridMetrics from './GridMetrics';
import type GridModel from './GridModel';
import GridRenderer from './GridRenderer';
import MockGridModel from './MockGridModel';
import GridTheme from './GridTheme';
import type TextCellRenderer from './TextCellRenderer';
import { type LinkToken } from './GridUtils';
import { type GridRenderState } from './GridRendererTypes';

const makeMockContext = (): CanvasRenderingContext2D =>
  // Just return a partial mock
  ({
    arc: jest.fn(),
    beginPath: jest.fn(),
    clip: jest.fn(),
    closePath: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    fill: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    lineTo: jest.fn(),
    measureText: jest.fn(str => ({ width: str.length * 10 }) as TextMetrics),
    moveTo: jest.fn(),
    rect: jest.fn(),
    restore: jest.fn(),
    setTransform: jest.fn(),
    save: jest.fn(),
    stroke: jest.fn(),
    strokeRect: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    createPattern: jest.fn(),
  }) as unknown as CanvasRenderingContext2D;

const makeMockGridMetrics = (): GridMetrics =>
  ({
    modelRows: new Map([
      [0, 0],
      [1, 1],
      [2, 2],
    ]),
    modelColumns: new Map([
      [0, 0],
      [1, 1],
      [2, 2],
    ]),
    allColumnXs: new Map([
      [0, 0],
      [1, 100],
      [2, 200],
    ]),
    allRowYs: new Map([
      [0, 0],
      [1, 10],
      [2, 20],
    ]),
    allColumnWidths: new Map([
      [0, 100],
      [1, 100],
      [2, 100],
    ]),
    allRowHeights: new Map([
      [0, 10],
      [1, 10],
      [2, 10],
    ]),
    fontWidthsLower: new Map(),
    fontWidthsUpper: new Map(),
  }) as GridMetrics;

const makeMockGridRenderState = ({
  metrics = makeMockGridMetrics(),
  model = new MockGridModel() as GridModel,
  context = makeMockContext(),
}: {
  metrics?: GridMetrics;
  model?: GridModel;
  context?: CanvasRenderingContext2D;
} = {}): GridRenderState => ({
  width: 100,
  height: 100,
  context,
  theme: GridTheme,
  model,
  metrics,
  mouseX: 0,
  mouseY: 0,
  cursorColumn: 0,
  cursorRow: 0,
  selectedRanges: [],
  draggingColumn: null,
  draggingColumnSeparator: null,
  draggingRow: null,
  draggingRowOffset: null,
  draggingRowSeparator: null,
  editingCell: null,
  isDragging: false,
  isDraggingHorizontalScrollBar: false,
  isDraggingVerticalScrollBar: false,
});

describe('getTokenBoxesForVisibleCell', () => {
  let renderer: GridRenderer;
  let renderState: GridRenderState;

  beforeAll(() => {
    renderer = new GridRenderer();
    renderState = makeMockGridRenderState({
      model: new MockGridModel({
        editedData: [
          [
            'https://google.com',
            'google',
            'http://google.com youtube.com email@gmail.com',
          ],
        ],
      }),
    });

    const textCellRenderer = renderer.getCellRenderer(
      'text'
    ) as TextCellRenderer;
    textCellRenderer.getCachedTruncatedString = jest.fn(
      (
        context: CanvasRenderingContext2D,
        text: string,
        width: number,
        fontWidthLower?: number,
        fontWidthUpper?: number,
        truncationChar?: string
      ) => text
    );
  });

  it('should return tokens that are visible in the cell', () => {
    const textCellRenderer = renderer.getCellRenderer(
      'text'
    ) as TextCellRenderer;
    const tokens = textCellRenderer.getTokenBoxesForVisibleCell(
      0,
      0,
      renderState
    );

    const expectedValue: LinkToken = {
      type: 'url',
      value: 'https://google.com',
      href: 'https://google.com',
      isLink: true,
      start: 0,
      end: 18,
    };

    expect(tokens).not.toBeNull();
    expect(tokens?.[0].token).toEqual(expectedValue);
  });

  it('should return multiple tokens', () => {
    const textCellRenderer = renderer.getCellRenderer(
      'text'
    ) as TextCellRenderer;
    const tokens = textCellRenderer.getTokenBoxesForVisibleCell(
      0,
      2,
      renderState
    );

    const expectedValue: LinkToken[] = [
      {
        type: 'url',
        value: 'http://google.com',
        isLink: true,
        href: 'http://google.com',
        start: 0,
        end: 17,
      },

      {
        type: 'email',
        value: 'email@gmail.com',
        isLink: true,
        href: 'mailto:email@gmail.com',
        start: 30,
        end: 45,
      },
    ];

    expect(tokens).not.toBeNull();
    expect(tokens?.length).toBe(2);
    expect(tokens?.[0].token).toEqual(expectedValue[0]);
    expect(tokens?.[1].token).toEqual(expectedValue[1]);
  });

  it('should return empty array if there are no tokens', () => {
    const textCellRenderer = renderer.getCellRenderer(
      'text'
    ) as TextCellRenderer;
    const tokens = textCellRenderer.getTokenBoxesForVisibleCell(
      0,
      1,
      renderState
    );

    expect(tokens).toHaveLength(0);
  });

  it('should return empty array if context or metrics is null', () => {
    // @ts-expect-error metrics and context usually can't be null
    renderState = makeMockGridRenderState({ metrics: null, context: null });
    const textCellRenderer = renderer.getCellRenderer(
      'text'
    ) as TextCellRenderer;
    const tokens = textCellRenderer.getTokenBoxesForVisibleCell(
      0,
      0,
      renderState
    );

    expect(tokens).toHaveLength(0);
  });
});

describe('binaryTruncateToWidth', () => {
  let context;

  beforeEach(() => {
    context = {
      measureText: jest.fn(),
    };
  });

  it('should return the full string if it fits within the width', () => {
    const input = 'Hello, World!';
    const width = 100;

    context.measureText.mockReturnValue({ width: 90 });
    const result = GridRenderer.binaryTruncateToWidth(context, input, width);

    expect(context.measureText).toHaveBeenCalledWith(input);
    expect(result).toBe(input);
  });

  it('should return truncation char repeated if it is provided and string does not fit', () => {
    const input = 'Hello, World!';
    const width = 50;
    const truncationChar = '#';

    context.measureText.mockImplementation(text => ({
      width: text.length * 10,
    }));

    const result = GridRenderer.binaryTruncateToWidth(
      context,
      input,
      width,
      0,
      input.length,
      truncationChar
    );

    expect(context.measureText).toHaveBeenCalledWith(truncationChar);
    expect(result).toBe('#####');
  });

  it('should use the lo and hi parameters to truncate correctly', () => {
    const input = 'HelloWorld';
    const width = 60;
    const lo = 5;
    const hi = 10;

    context.measureText.mockImplementation(text => ({
      width: text.length * 10,
    }));

    const result = GridRenderer.binaryTruncateToWidth(
      context,
      input,
      width,
      lo,
      hi
    );

    // 1: measure entire string to see if it fits in width
    // 2: mid = 7, HelloWo… is 80 wide, so we need to truncate more
    // 3: mid = 6, HelloW… is 70 wide, so we need to truncate more
    // 4: mid = 5, Hello… is 60 wide, so it fits and we are done
    expect(context.measureText).toHaveBeenNthCalledWith(1, input);
    expect(context.measureText).toHaveBeenNthCalledWith(2, 'HelloWo…');
    expect(context.measureText).toHaveBeenNthCalledWith(3, 'HelloW…');
    expect(context.measureText).toHaveBeenNthCalledWith(4, 'Hello…');
    expect(result).toBe('Hello…');
  });

  it('should return full string if valid truncation not found in given range', () => {
    const input = 'Hello World';
    const width = 50;
    const lo = 11;
    const hi = 12;

    context.measureText.mockImplementation(text => ({
      width: text.length * 10,
    }));

    const result = GridRenderer.binaryTruncateToWidth(
      context,
      input,
      width,
      lo,
      hi
    );

    expect(result).toBe('Hello World');
  });
});

describe('truncateToWidth', () => {
  let context;

  beforeEach(() => {
    context = {
      measureText: jest.fn(),
    };
  });

  it('should return an empty string if width is less than or equal to 0', () => {
    const input = 'Hello, World!';
    const width = 0;

    const result = GridRenderer.truncateToWidth(context, input, width);

    expect(result).toBe('');
    expect(context.measureText).not.toHaveBeenCalled();
  });

  it('should return an empty string if the input string is empty', () => {
    const input = '';
    const width = 100;

    const result = GridRenderer.truncateToWidth(context, input, width);

    expect(result).toBe('');
    expect(context.measureText).not.toHaveBeenCalled();
  });

  it('should calculate the correct lo hi based on fontWidthUpper and fontWidthLower', () => {
    const input = 'HelloWorld'; // only used for input length, as hi is clamped to input length
    const width = 60;
    const fontWidthLower = 10;
    const fontWidthUpper = 15;

    jest.spyOn(GridRenderer, 'binaryTruncateToWidth');
    context.measureText.mockReturnValue({ width: 0 });

    GridRenderer.truncateToWidth(
      context,
      input,
      width,
      fontWidthLower,
      fontWidthUpper
    );

    const expectedLo = 0; // 60/15-5 = -1 clamped to 0
    const expectedHi = 6; // 60/10 = 6

    expect(GridRenderer.binaryTruncateToWidth).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expectedLo,
      expectedHi,
      undefined
    );
  });
});
