class ColorUtils {
  /**
   * THIS HAS POOR PERFORMANCE DUE TO DOM MANIPULATION
   * Attempt to get the rgb or rgba string for a color string. If the color string
   * can't be resolved to a valid color, null is returned.
   * @param colorString The color string to resolve
   */
  static asRgbOrRgbaString(colorString: string): string | null {
    if (
      // Since dom manipulation is expensive, we want to avoid it if possible.
      /^rgb/.test(colorString) ||
      /^rgba/.test(colorString) ||
      /^color\(srgb/.test(colorString)
    ) {
      return colorString;
    }

    const divEl = document.createElement('div');
    divEl.style.display = 'none';
    divEl.style.backgroundColor = colorString;
    const color = window
      .getComputedStyle(document.body.appendChild(divEl))
      .getPropertyValue('background-color');
    divEl.remove();

    return color || null;
  }

  /**
   * THIS HAS POOR PERFORMANCE DUE TO DOM MANIPULATION
   * DO NOT USE HEAVILY
   * Checks if a background color is dark (i.e. should use a light foreground).
   *
   * @param background the background color
   */
  static isDark(background: string): boolean {
    const d = document.createElement('div');
    d.style.display = 'none';
    d.style.backgroundColor = background;

    const computedColor = getComputedStyle(
      document.body.appendChild(d)
    ).backgroundColor;
    const colorTokens = computedColor.match(/\d+/g);
    let color: number[] = [];

    if (colorTokens) {
      color = colorTokens.map(a => parseInt(a, 10));
    } else {
      throw new Error(`Invalid color received. Got ${computedColor}`);
    }
    document.body.removeChild(d);
    const brightness = ColorUtils.getBrightness(color);
    return brightness < 125;
  }

  // Note: leaving this as arbitrary length number[] in case of RGBA().
  static getBrightness(color: number[]): number {
    // http://www.w3.org/TR/AERT#color-contrast
    return Math.round(
      (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000
    );
  }

  /**
   * THIS HAS POOR PERFORMANCE DUE TO DOM MANIPULATION
   * Normalize a css color to 8 character hex value (or 6 character hex if
   * isAlphaOptional is true and alpha is 'ff'). If the color can't be resolved,
   * return the original string.
   * @param colorString The color string to normalize
   * @param isAlphaOptional If true, the alpha value will be dropped if it is 'ff'.
   * Defaults to false.
   */
  static normalizeCssColor(
    colorString: string,
    isAlphaOptional = false
  ): string {
    const maybeRgbOrRgba = ColorUtils.asRgbOrRgbaString(colorString);
    if (maybeRgbOrRgba == null) {
      return colorString;
    }

    const rgba = ColorUtils.parseRgba(maybeRgbOrRgba);
    if (rgba === null) {
      return colorString;
    }

    const hex8 = ColorUtils.rgbaToHex8(rgba);
    if (isAlphaOptional === true) {
      return hex8.replace(/^(#[a-f0-9]{6})ff$/, '$1');
    }

    return hex8;
  }

  /**
   * Parse a given `rgb` or `rgba` css expression into its constituent r, g, b, a
   * values. If the expression cannot be parsed, it will return null.
   * Note that this parser is more permissive than the CSS spec and shouldn't be
   * relied on as a full validation mechanism. For the most part, it assumes that
   * the input is already a valid rgb or rgba expression.
   *
   * e.g. `rgb(255, 255, 255)` -> `{ r: 255, g: 255, b: 255, a: 1 }`
   * e.g. `rgba(255, 255, 255, 0.5)` -> `{ r: 255, g: 255, b: 255, a: 0.5 }`
   * e.g. `color(srgb 1 1 0 / 0.25)` -> `{ r: 255, g: 255, b: 0, a: 0.25 }`
   * @param rgbOrRgbaString The rgb or rgba string to parse
   */
  static parseRgba(
    rgbOrRgbaString: string
  ): { r: number; g: number; b: number; a: number } | null {
    // if color(srgb) format, we handle that differently

    const [r, g, b, a] =
      rgbOrRgbaString.match(
        // loose with the regex to allow for different formats between browsers
        // take the first 4 digits that look like numbers, including decimals
        // We've already checked it's a valid color with CSS.supports
        /(?:\b\d+\.\d*|\b\d+|\.\d+)/g
      ) ?? [];

    if (r == null || g == null || b == null) {
      return null;
    }

    if (rgbOrRgbaString.startsWith('color(srgb')) {
      return {
        r: Math.round(Number(r) * 255),
        g: Math.round(Number(g) * 255),
        b: Math.round(Number(b) * 255),
        a: Number(a ?? 1),
      };
    }

    // return 1 for any alpha value greater than 1
    return {
      r: Number(r),
      g: Number(g),
      b: Number(b),
      a: Math.min(Number(a ?? 1), 1),
    };
  }

  /**
   * Convert an rgba object to an 8 character hex color string.
   * @param r The red value
   * @param g The green value
   * @param b The blue value
   * @param a The alpha value (defaults to 1)
   * @returns The a character hex string with # prefix
   */
  static rgbaToHex8({
    r,
    g,
    b,
    a = 1,
  }: {
    r: number;
    g: number;
    b: number;
    a?: number;
  }): string {
    // eslint-disable-next-line no-param-reassign
    a = Math.round(a * 255);

    const [rh, gh, bh, ah] = [r, g, b, a].map(v =>
      v.toString(16).padStart(2, '0')
    );

    return `#${rh}${gh}${bh}${ah}`;
  }
}
export default ColorUtils;
