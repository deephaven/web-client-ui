import { TestUtils } from '@deephaven/test-utils';
import GridRenderer from './GridRenderer';
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
