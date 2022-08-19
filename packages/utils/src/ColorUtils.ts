class ColorUtils {
  /**
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
}
export default ColorUtils;
