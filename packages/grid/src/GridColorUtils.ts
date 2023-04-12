import convert from 'color-convert';
import { HEX } from 'color-convert/conversions';
import { GridColor } from './GridTypes';

/**
 * Darken the provided colour
 * @param color Color in hex format to convert (with #)
 * @param depth Depth to convert the color to
 * @param maxDepth Maximum depth. Defaults to 6
 * @returns Darkened colour in hex format
 */
export function darkenForDepth(
  color: HEX,
  depth: number,
  maxDepth = 6
): GridColor {
  const lab = convert.hex.lab.raw(color);
  lab[0] = Math.max(lab[0] - (lab[0] / maxDepth) * depth, 0);
  return `#${convert.lab.hex(lab)}`;
}

/**
 * Convert a hex colour to an rgba with specified alpha
 * @param color Color in hex format to convert (with #)
 * @param alpha Alpha to apply to the color
 * @returns Color with the newly applied alpha in rgba format
 */
export function colorWithAlpha(color: HEX, alpha: number): GridColor {
  const [r, g, b] = convert.hex.rgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default { colorWithAlpha, darkenForDepth };
