import convert from 'color-convert';

class GridColorUtils {
  /**
   *
   * @param {string} color The color in hex format to convert (with #)
   * @param {number} depth The depth to convert the color to
   * @param {number} maxDepth The maximum depth. Defaults to 6
   * @returns {string} The darkened colour in hex format
   */
  static darkenForDepth(color, depth, maxDepth = 6) {
    const lab = convert.hex.lab(color);
    lab[0] = Math.max(lab[0] - (lab[0] / maxDepth) * depth, 0);
    return `#${convert.lab.hex(lab)}`;
  }

  static colorWithAlpha(color, alpha) {
    const [r, g, b] = convert.hex.rgb(color);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

export default GridColorUtils;
