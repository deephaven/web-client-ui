import ColorUtils from './ColorUtils';
import TestUtils from './TestUtils';

const { createMockProxy } = TestUtils;

const getColor = jest.fn();
const setColor = jest.fn();

const mockDivEl = createMockProxy<HTMLDivElement>({
  style: {
    get color(): string {
      return getColor();
    },
    set color(value: string) {
      setColor(value);
    },
  } as HTMLDivElement['style'],
  remove: jest.fn(),
});

const colorMap = [
  {
    rgb: { r: 255, g: 0, b: 0 },
    hex: '#ff0000ff',
  },
  {
    rgb: { r: 255, g: 128, b: 0 },
    hex: '#ff8000ff',
  },
  {
    rgb: { r: 255, g: 255, b: 0 },
    hex: '#ffff00ff',
  },
  {
    rgb: { r: 128, g: 255, b: 0 },
    hex: '#80ff00ff',
  },
  {
    rgb: { r: 0, g: 255, b: 0 },
    hex: '#00ff00ff',
  },
  {
    rgb: { r: 0, g: 255, b: 128 },
    hex: '#00ff80ff',
  },
  {
    rgb: { r: 0, g: 255, b: 255 },
    hex: '#00ffffff',
  },
  {
    rgb: { r: 0, g: 128, b: 255 },
    hex: '#0080ffff',
  },
  {
    rgb: { r: 0, g: 0, b: 255 },
    hex: '#0000ffff',
  },
  {
    rgb: { r: 128, g: 0, b: 255 },
    hex: '#8000ffff',
  },
  {
    rgb: { r: 255, g: 0, b: 255 },
    hex: '#ff00ffff',
  },
  {
    rgb: { r: 255, g: 0, b: 128 },
    hex: '#ff0080ff',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  expect.hasAssertions();

  getColor.mockName('getColor');
  setColor.mockName('setColor');
});

describe('asRgbOrRgbaString', () => {
  it.each([
    ['rgb(0, 128, 255)'],
    ['rgb(0,128,255)'],
    ['rgba(0, 128, 255, 0.1)'],
    ['rgba(0, 128, 255, 1)'],
    ['color(srgb 1, 1, 1 / 1)'],
    ['color(srgb 0,0,0 / 0)'],
    ['color(srgb 0, 0.2, 0.2 / 0.2)'],
    ['color(srgb 0,0,0)'],
    ['color(srgb 0 0.2 0.2)'],
  ])(
    'should return the color string if it is already in the expected format: %s',
    colorString => {
      const result = ColorUtils.asRgbOrRgbaString(colorString);
      expect(result).toEqual(colorString);
    }
  );

  it('should return the resolved color string if it is not in the expected format', () => {
    const colorString = 'red';
    const resolvedColor = 'rgb(255, 0, 0)';

    jest.spyOn(document, 'createElement').mockReturnValue(mockDivEl);
    jest.spyOn(document.body, 'appendChild').mockReturnValue(mockDivEl);
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: jest.fn().mockReturnValue(resolvedColor),
    } as unknown as CSSStyleDeclaration);

    const result = ColorUtils.asRgbOrRgbaString(colorString);
    expect(result).toEqual(resolvedColor);
    expect(document.createElement).toHaveBeenCalledWith('div');
    expect(window.getComputedStyle).toHaveBeenCalledWith(mockDivEl);
    expect(mockDivEl.remove).toHaveBeenCalled();
  });

  it('should return null if the resolved color string is null', () => {
    const colorString = 'red';
    jest.spyOn(document, 'createElement').mockReturnValue(mockDivEl);
    jest.spyOn(document.body, 'appendChild').mockReturnValue(mockDivEl);
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: jest.fn().mockReturnValue(null),
    } as unknown as CSSStyleDeclaration);

    const result = ColorUtils.asRgbOrRgbaString(colorString);
    expect(result).toBeNull();
    expect(document.createElement).toHaveBeenCalledWith('div');
    expect(window.getComputedStyle).toHaveBeenCalledWith(mockDivEl);
    expect(mockDivEl.remove).toHaveBeenCalled();
  });
});

describe('isDark', () => {
  it('returns true if the background is dark', () => {
    expect(ColorUtils.isDark('#000000')).toBe(true);
    expect(ColorUtils.isDark('#000')).toBe(true);
    expect(ColorUtils.isDark('rgb(0,0,0)')).toBe(true);
    expect(ColorUtils.isDark('rgba(0,0,0,1)')).toBe(true);
    expect(ColorUtils.isDark('hsl(0,0%,0%)')).toBe(true);
  });

  it('returns false if the background is bright', () => {
    expect(ColorUtils.isDark('#ffffff')).toBe(false);
    expect(ColorUtils.isDark('#fff')).toBe(false);
    expect(ColorUtils.isDark('rgb(255,255,255)')).toBe(false);
    expect(ColorUtils.isDark('rgba(255,255,255,1)')).toBe(false);
    expect(ColorUtils.isDark('hsl(0,100%,100%)')).toBe(false);
  });

  it('throws an error if the color is not a valid value', () => {
    expect(() => ColorUtils.isDark('')).toThrowError(/Invalid color received/);
  });
});

describe('normalizeCssColor', () => {
  beforeEach(() => {
    jest
      .spyOn(document, 'createElement')
      .mockName('createElement')
      .mockReturnValue(mockDivEl);
    jest.spyOn(document.body, 'appendChild').mockReturnValue(mockDivEl);
  });

  it.each([
    'rgb(0, 128, 255)',
    'rgba(0, 128, 255, 64)',
    'rgb(0 128 255)',
    'rgba(0 128 255 64)',
  ])(
    'should normalize a resolved rgb/a color to 8 character hex value',
    rgbOrRgbaColor => {
      getColor.mockReturnValue(rgbOrRgbaColor);

      jest.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: jest.fn().mockReturnValue(rgbOrRgbaColor),
      } as unknown as CSSStyleDeclaration);

      const actual = ColorUtils.normalizeCssColor('some.color');
      expect(actual).toEqual(
        ColorUtils.rgbaToHex8(ColorUtils.parseRgba(rgbOrRgbaColor)!)
      );
    }
  );

  it('should return original color if Color resolves to empty string', () => {
    getColor.mockReturnValue('');

    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: jest.fn().mockReturnValue(''),
    } as unknown as CSSStyleDeclaration);

    const actual = ColorUtils.normalizeCssColor('red');
    expect(actual).toEqual('red');
  });

  it('should return original color if Color resolves to non rgb/a', () => {
    getColor.mockReturnValue('xxx');

    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: jest.fn().mockReturnValue('xxx'),
    } as unknown as CSSStyleDeclaration);

    const actual = ColorUtils.normalizeCssColor('red');
    expect(actual).toEqual('red');
  });
});

describe('parseRgba', () => {
  it.each([
    ['rgb(255, 255, 255)', { r: 255, g: 255, b: 255, a: 1 }],
    ['rgb(0,0,0)', { r: 0, g: 0, b: 0, a: 1 }],
    ['rgb(255 255 255)', { r: 255, g: 255, b: 255, a: 1 }],
    ['rgb(0 0 0)', { r: 0, g: 0, b: 0, a: 1 }],
    ['rgb(0 128 255)', { r: 0, g: 128, b: 255, a: 1 }],
    ['rgb(0 128 255 / .5)', { r: 0, g: 128, b: 255, a: 0.5 }],
  ])('should parse rgb: %s, %s', (rgb, hex) => {
    expect(ColorUtils.parseRgba(rgb)).toEqual(hex);
  });

  it.each([
    ['rgba(255, 255, 255, 1)', { r: 255, g: 255, b: 255, a: 1 }],
    ['rgba(0,0,0,0)', { r: 0, g: 0, b: 0, a: 0 }],
    ['rgba(255 255 255 1)', { r: 255, g: 255, b: 255, a: 1 }],
    ['rgba(0 0 0 0)', { r: 0, g: 0, b: 0, a: 0 }],
    ['rgba(0 128 255 .5)', { r: 0, g: 128, b: 255, a: 0.5 }],
  ])('should parse rgba: %s, %s', (rgba, hex) => {
    expect(ColorUtils.parseRgba(rgba)).toEqual(hex);
  });

  it.each([
    ['color(srgb 1 1 1 1)', { r: 255, g: 255, b: 255, a: 1 }],
    ['color(srgb 1, 1, 1, 1)', { r: 255, g: 255, b: 255, a: 1 }],
    ['color(srgb 1, 1, 1 / 1)', { r: 255, g: 255, b: 255, a: 1 }],
    ['color(srgb 0,0,0 / 0)', { r: 0, g: 0, b: 0, a: 0 }],
    ['color(srgb 0 0 0 / 0)', { r: 0, g: 0, b: 0, a: 0 }],
    ['color(srgb 0 0.2 0.2 / 0.2)', { r: 0, g: 51, b: 51, a: 0.2 }],
  ])('should parse rgba: %s, %s', (rgba, hex) => {
    expect(ColorUtils.parseRgba(rgba)).toEqual(hex);
  });

  it('should return null if not rgb or rgba', () => {
    expect(ColorUtils.parseRgba('xxx')).toBeNull();
  });

  it.each(['rgb(0 128)', 'rgba(0 128)', 'rgb(0, 128)', 'rgba(0, 128)'])(
    'should return null if given < 3 args',
    value => {
      expect(ColorUtils.parseRgba(value)).toBeNull();
    }
  );
});

describe('rgbaToHex8', () => {
  it.each(colorMap)('should convert rgb to hex: %s, %s', ({ rgb, hex }) => {
    expect(ColorUtils.rgbaToHex8(rgb)).toEqual(hex);
  });
});
