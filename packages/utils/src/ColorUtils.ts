class ColorUtils {
  /**
   * Attempt to get the rgb or rgba string for a color string. If the color string
   * can't be resolved to a valid color, null is returned.
   * @param colorString The color string to resolve
   */
  static asRgbOrRgbaString(colorString: string): string | null {
    const divEl = document.createElement('div');
    divEl.style.backgroundColor = colorString;

    if (divEl.style.backgroundColor === '') {
      return null;
    }

    return divEl.style.backgroundColor;
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
    d.style.color = background;

    const computedColor = getComputedStyle(document.body.appendChild(d)).color;
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
   * Normalize a css color to 8 character hex value. If the color can't be resolved,
   * return the original color string.
   * @param colorString The color string to normalize
   */
  static normalizeCssColor(colorString: string): string {
    const maybeRgbOrRgba = ColorUtils.asRgbOrRgbaString(colorString);
    if (maybeRgbOrRgba == null) {
      return colorString;
    }

    const rgba = ColorUtils.parseRgba(maybeRgbOrRgba);
    if (rgba === null) {
      return colorString;
    }

    return ColorUtils.rgbaToHex8(rgba);
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
   * @param rgbOrRgbaString The rgb or rgba string to parse
   */
  static parseRgba(
    rgbOrRgbaString: string
  ): { r: number; g: number; b: number; a: number } | null {
    const [, name, args] = /^(rgba?)\((.*?)\)$/.exec(rgbOrRgbaString) ?? [];
    if (name == null) {
      return null;
    }

    // Split on spaces, commas, and slashes. Note that this more permissive than
    // the CSS spec in that slashes should only be used to delimit the alpha value
    // (e.g. r g b / a), but this would match r/g/b/a. It also would match a mixed
    // delimiter case (e.g. r,g b,a). This seems like a reasonable tradeoff for the
    // complexity that would be added to enforce the full spec.
    const tokens = args.split(/[ ,/]/).filter(Boolean);

    if (tokens.length < 3) {
      return null;
    }

    const [r, g, b, a = 1] = tokens.map(Number);

    return { r, g, b, a };
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
