import convert from 'color-convert';
import { HEX } from 'color-convert/conversions';
import clamp from 'lodash.clamp';
import { GridColor } from './GridTheme';

export type RGB = { r: number; g: number; b: number };
export type Oklab = { L: number; a: number; b: number };

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

/**
 * Converts a color in RGB to Oklab
 * Formula provided here: https://bottosson.github.io/posts/oklab/#converting-from-linear-srgb-to-oklab
 * @param color An RGB color
 * @returns The color but respresented as an Oklab color
 */
const linearSRGBToOklab = (color: RGB): Oklab => {
  const { r, g, b } = color;

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l2 = Math.cbrt(l);
  const m2 = Math.cbrt(m);
  const s2 = Math.cbrt(s);

  return {
    L: 0.2104542553 * l2 + 0.793617785 * m2 - 0.0040720468 * s2,
    a: 1.9779984951 * l2 - 2.428592205 * m2 + 0.4505937099 * s2,
    b: 0.0259040371 * l2 + 0.7827717662 * m2 - 0.808675766 * s2,
  };
};

/**
 * Converts an Oklab color to RGB
 * Formula provided here: https://bottosson.github.io/posts/oklab/#converting-from-linear-srgb-to-oklab
 * @param color An Oklab color
 * @returns The given color but represented as a RGB color
 */
const OklabToLinearSRGB = (color: Oklab): RGB => {
  const { L, a, b } = color;

  const l2 = L + 0.3963377774 * a + 0.2158037573 * b;
  const m2 = L - 0.1055613458 * a - 0.0638541728 * b;
  const s2 = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l2 * l2 * l2;
  const m = m2 * m2 * m2;
  const s = s2 * s2 * s2;

  return {
    r: clamp(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, 0, 255),
    g: clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, 0, 255),
    b: clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s, 0, 255),
  };
};

/**
 * Converts a hex color to RGB
 * Algorithm from https://stackoverflow.com/a/39077686/20005358
 * @param hex A hex color
 * @returns The RGB representation of the given color
 */
const hexToRgb = (hex: string): RGB => {
  const rgbArray = hex
    .replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m: string, r: string, g: string, b: string) =>
        `#${r}${r}${g}${g}${b}${b}`
    )
    .substring(1)
    .match(/.{2}/g)
    ?.map((x: string) => parseInt(x, 16)) ?? [0, 0, 0];

  return { r: rgbArray[0], g: rgbArray[1], b: rgbArray[2] };
};

/**
 * Converts a RGB color to hex
 * Algorithm from https://stackoverflow.com/a/39077686/20005358
 * @param color A RGB color
 * @returns The hexcode of the given color
 */
const rgbToHex = (color: RGB): string => {
  const r = Math.round(color.r);
  const g = Math.round(color.g);
  const b = Math.round(color.b);

  return `#${[r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    })
    .join('')}`;
};

/**
 * Calculates a color given an interpolation factor between two given colors
 * @param color1 Color on one end
 * @param color2 Color on other end
 * @param factor The interpolation factor (0 to 1, 0 will be color1 while 1 will be color2)
 * @returns The color determined by the interpolation factor between the two colors
 */
const lerpColor = (color1: Oklab, color2: Oklab, factor: number): Oklab => {
  const { L: L1, a: a1, b: b1 } = color1;
  const { L: L2, a: a2, b: b2 } = color2;

  const L = L1 + (L2 - L1) * factor;
  const a = a1 + (a2 - a1) * factor;
  const b = b1 + (b2 - b1) * factor;

  return { L, a, b };
};

export default {
  colorWithAlpha,
  darkenForDepth,
  linearSRGBToOklab,
  OklabToLinearSRGB,
  hexToRgb,
  rgbToHex,
  lerpColor,
};
