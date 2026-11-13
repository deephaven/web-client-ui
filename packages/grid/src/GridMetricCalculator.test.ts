import GridMetricCalculator, {
  type GridMetricState,
  trimMap,
} from './GridMetricCalculator';
import GridTheme from './GridTheme';
import MockGridModel from './MockGridModel';

describe('trimMap', () => {
  function makeMap(low = 0, high = 10): Map<number, number> {
    const map = new Map();
    for (let i = low; i <= high; i += 1) {
      map.set(i, i);
    }
    return map;
  }

  function expectResult(
    map: Map<number, number>,
    expectedMap: Map<number, number>,
    cacheSize = 10,
    targetSize = 5
  ) {
    trimMap(map, cacheSize, targetSize);
    expect(map.size).toEqual(expectedMap.size);
    const iter = map.entries();
    const expectedIter = expectedMap.entries();
    let iterValue = iter.next();
    let expectedIterValue = expectedIter.next();
    while (iterValue.done === undefined) {
      expect(iterValue.value[0]).toEqual(expectedIterValue.value[0]);
      expect(iterValue.value[1]).toEqual(expectedIterValue.value[1]);
      iterValue = iter.next();
      expectedIterValue = expectedIter.next();
    }
  }

  it('does not change map if within trim size', () => {
    expectResult(new Map(), new Map());
    expectResult(makeMap(0, 0), makeMap(0, 0));
    expectResult(makeMap(0, 9), makeMap(0, 9));
  });

  it('trims map if larger than cache size', () => {
    expectResult(makeMap(0, 10), makeMap(6, 10));
    expectResult(makeMap(0, 100), makeMap(96, 100));
    expectResult(makeMap(0, 100), makeMap(51, 100), 100, 50);
  });
});

describe('calculateTextWidth', () => {
  let font = 'mock font';
  const mockCharWidths = new Map([
    ['a', 10],
    ['b', 20],
    ['c', 30],
    ['d', 40],
    ['e', 50],
    ['ab', 30],
    ['bc', 50],
    ['cd', 70],
    ['de', 90],
  ]);
  let gridMetricCalculator;
  let allCharWidths;

  beforeEach(() => {
    gridMetricCalculator = new GridMetricCalculator();
    allCharWidths = new Map();
    Object.assign(gridMetricCalculator, {
      allCharWidths,
    });
  });

  it('should calculate text width and cache char widths if not in cache', () => {
    const input = 'abc';
    const mockContext = {
      measureText: jest.fn().mockImplementation(char => ({
        width: mockCharWidths.get(char),
      })),
    };

    const textWidth = gridMetricCalculator.calculateTextWidth(
      mockContext,
      font,
      input
    );

    const charWidths = allCharWidths.get(font);
    expect(charWidths.get('ab')).toEqual(30);
    expect(charWidths.get('bc')).toEqual(50);
    expect(charWidths.get('b')).toEqual(20);
    expect(textWidth).toEqual(60);
  });

  it('should calculate text width using cached char widths if in cache', () => {
    const input = 'abcd';
    const mockContext = {
      measureText: jest.fn().mockImplementation(char => ({
        width: mockCharWidths.get(char),
      })),
    };
    const dummyMockContext = {
      measureText: jest.fn(),
    };

    const firstRun = gridMetricCalculator.calculateTextWidth(
      mockContext,
      font,
      input
    );
    const secondRun = gridMetricCalculator.calculateTextWidth(
      dummyMockContext,
      font,
      input
    );

    expect(dummyMockContext.measureText).toHaveBeenCalledTimes(0);
    expect(firstRun).toEqual(100);
    expect(secondRun).toEqual(100);
  });

  it('should clamp the result to max width', () => {
    const input = 'abcde';
    const mockContext = {
      measureText: jest.fn().mockImplementation(char => ({
        width: mockCharWidths.get(char),
      })),
    };

    const textWidth = gridMetricCalculator.calculateTextWidth(
      mockContext,
      font,
      input,
      50
    );

    expect(textWidth).toEqual(50);
  });

  it('should stop measuring text too long to cache once max width is exceeded', () => {
    const input = 'ab'.repeat(GridMetricCalculator.MAX_CACHED_TEXT_LENGTH);
    const mockContext = {
      measureText: jest.fn().mockImplementation(chars => ({
        width: chars.length * 10,
      })),
    };

    const textWidth = gridMetricCalculator.calculateTextWidth(
      mockContext,
      font,
      input,
      50
    );

    expect(textWidth).toEqual(50);
    // Only the first few characters should have been measured, not the whole string
    expect(mockContext.measureText.mock.calls.length).toBeLessThan(10);
  });

  it('should keep text widths cached past the general cache size', () => {
    const mockContext = {
      measureText: jest.fn().mockImplementation(chars => ({
        width: chars.length * 10,
      })),
    };
    for (let i = 0; i <= GridMetricCalculator.CACHE_SIZE; i += 1) {
      gridMetricCalculator.calculateTextWidth(mockContext, font, `${i}`);
    }
    const measureTextWidth = jest.spyOn(
      gridMetricCalculator,
      'measureTextWidth'
    );

    gridMetricCalculator.calculateTextWidth(mockContext, font, '0');

    expect(measureTextWidth).not.toHaveBeenCalled();
  });

  // This test checks that the calculation logic is equivalent to the native canvas one.
  // It doesn’t verify that it addresses font kerning properly, since it doesn’t actually render the text and context.measureText() just returns the text length
  it.each([
    [''],
    ['a'],
    ['a                                                                 b'],
    [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    ],
    [
      'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii',
    ],
    [
      'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    ],
    [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    ],
  ])(
    'should match the value calculated by context.measureText(): "%s"',
    text => {
      const canvas = global.document.createElement('canvas');
      const context = canvas.getContext('2d');
      font = '20px Arial';

      if (context === null) {
        throw new Error('Could not get canvas context');
      }

      context.font = font;
      const a = gridMetricCalculator.calculateTextWidth(context, font, text);
      const b = context.measureText(text).width;

      expect(a).toEqual(b);
    }
  );
});

describe('getMetrics', () => {
  function makeState(): GridMetricState {
    const context = global.document
      .createElement('canvas')
      .getContext('2d') as CanvasRenderingContext2D;
    return {
      left: 0,
      top: 0,
      leftOffset: 0,
      topOffset: 0,
      width: 800,
      height: 400,
      context,
      theme: GridTheme,
      model: new MockGridModel({ rowCount: 1000, columnCount: 50 }),
      movedColumns: [],
      movedRows: [],
      isDraggingHorizontalScrollBar: false,
      isDraggingVerticalScrollBar: false,
      draggingColumn: null,
    };
  }

  it('measures each auto-sized column once per call', () => {
    const calculator = new GridMetricCalculator();
    const calculateColumnDataWidth = jest.spyOn(
      calculator,
      'calculateColumnDataWidth'
    );

    calculator.getMetrics(makeState());

    const measuredColumns = calculateColumnDataWidth.mock.calls.map(
      ([modelColumn]) => modelColumn
    );
    expect(measuredColumns.length).toBeGreaterThan(0);
    expect(new Set(measuredColumns).size).toBe(measuredColumns.length);
  });

  it('measures columns again on the next call', () => {
    const calculator = new GridMetricCalculator();
    const state = makeState();
    calculator.getMetrics(state);
    const calculateColumnDataWidth = jest.spyOn(
      calculator,
      'calculateColumnDataWidth'
    );

    calculator.getMetrics(state);

    expect(calculateColumnDataWidth).toHaveBeenCalled();
  });

  it('returns the same column widths as measuring each column directly', () => {
    const calculator = new GridMetricCalculator();
    const state = makeState();

    const { visibleColumns, visibleColumnWidths } =
      calculator.getMetrics(state);

    visibleColumns.forEach(column => {
      expect(visibleColumnWidths.get(column)).toBe(
        calculator.getVisibleColumnWidth(column, state)
      );
    });
  });
});
