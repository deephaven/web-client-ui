class ColorUtils {
  /**
   * Checks if a background color is dark (i.e. should use a light foreground).
   *
   * @param {string} background the background color
   */
  static isDark(background) {
    const d = document.createElement('div');
    d.style.display = 'none';
    d.style.color = background;
    const color = getComputedStyle(document.body.appendChild(d))
      .color.match(/\d+/g)
      .map(a => parseInt(a, 10));
    document.body.removeChild(d);
    const brightness = ColorUtils.getBrightness(color);
    return brightness < 125;
  }

  static getBrightness(color) {
    // http://www.w3.org/TR/AERT#color-contrast
    return Math.round(
      (parseInt(color[0], 10) * 299 +
        parseInt(color[1], 10) * 587 +
        parseInt(color[2], 10) * 114) /
        1000
    );
  }
}
export default ColorUtils;
