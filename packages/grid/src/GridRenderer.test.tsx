import GridMetrics from './GridMetrics';
import GridModel from './GridModel';
import GridRenderer from './GridRenderer';
import MockGridModel from './MockGridModel';
import GridTheme from './GridTheme';
import { LinkToken } from './GridUtils';
import { GridRenderState } from './GridRendererTypes';

const makeMockContext = (): CanvasRenderingContext2D =>
  // Just return a partial mock
  (({
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
    measureText: jest.fn(str => ({ width: str.length * 10 } as TextMetrics)),
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
  } as unknown) as CanvasRenderingContext2D);

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
  } as GridMetrics);

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

    renderer.getCachedTruncatedString = jest.fn(
      (
        context: CanvasRenderingContext2D,
        text: string,
        width: number,
        fontWidth: number,
        truncationChar?: string
      ) => text
    );
  });

  it('should return tokens that are visible in the cell', () => {
    const tokens = renderer.getTokenBoxesForVisibleCell(0, 0, renderState);

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
    const tokens = renderer.getTokenBoxesForVisibleCell(0, 2, renderState);

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
    const tokens = renderer.getTokenBoxesForVisibleCell(0, 1, renderState);

    expect(tokens).toHaveLength(0);
  });

  it('should return empty array if context or metrics is null', () => {
    // @ts-expect-error metrics and context usually can't be null
    renderState = makeMockGridRenderState({ metrics: null, context: null });
    const tokens = renderer.getTokenBoxesForVisibleCell(0, 0, renderState);

    expect(tokens).toHaveLength(0);
  });
});
