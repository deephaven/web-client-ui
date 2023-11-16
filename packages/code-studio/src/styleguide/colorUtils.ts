import { ColorUtils } from '@deephaven/utils';

export const INVALID_COLOR_BORDER_STYLE =
  '2px solid var(--dh-color-notice-default-bg)';

/** Return black or white contrast color */
export function contrastColor(color: string): 'black' | 'white' {
  const rgba = ColorUtils.parseRgba(ColorUtils.asRgbOrRgbaString(color) ?? '');
  if (rgba == null || rgba.a < 0.5) {
    return 'white';
  }

  const { r, g, b } = rgba;
  return ColorUtils.getBrightness([r, g, b]) >= 128 ? 'black' : 'white';
}

/** Extract an array of { name, value } pairs for css variables in a given string  */
export function extractColorVars(
  styleText: string
): { name: string; value: string }[] {
  const computedStyle = getComputedStyle(document.documentElement);
  const varNames = styleText
    .split(/[\n;]/g)
    // Non-minified css will have leading 2 spaces in front of each css variable
    // declaration. Minified has no prefix except for the first line which will
    // have ':root{' prefix.
    .map(line => /^(?:\s{2}|:root\{)?(--dh-color-(?:[^:]+))/.exec(line)?.[1])
    .filter((match): match is string => Boolean(match));

  return varNames
    .map(varName => {
      const value = computedStyle.getPropertyValue(varName);

      // Chart colorway consists of multiple colors, so split into separate
      // swatches for illustration. Note that this assumes the colors are hsl
      // values. We'll need to make this more robust if we ever change the
      // default themes to use non-hsl.
      if (varName === '--dh-color-chart-colorway') {
        const colorwayColors = value
          .split('hsl')
          .filter(Boolean)
          .map(v => `hsl${v.trim()}`);

        return colorwayColors.map((varExp, i) => ({
          name: `${varName}-${i}`,
          value: varExp,
        }));
      }

      return {
        name: varName,
        value,
      };
    })
    .flat();
}

/** Group color data based on capture group value */
export function buildColorGroups(
  styleText: string,
  captureGroupI: number,
  reassignVarGroups: Record<string, string> = {},
  groupRemap: Record<string, string> = {}
): Record<string, { name: string; value: string }[]> {
  const swatchData = extractColorVars(styleText);

  const groupData = swatchData.reduce(
    (acc, { name, value }) => {
      const match = /^--dh-color-([^-]+)(?:-([^-]+))?/.exec(name);
      let group =
        reassignVarGroups[name] ??
        match?.[captureGroupI] ??
        match?.[1] ??
        '???';

      group = groupRemap[group] ?? group;

      if (acc[group] == null) {
        acc[group] = [];
      }

      // Skip -hsl variables since they aren't actually colors yet
      if (/^--dh-color-(.*?)-hsl$/.test(name)) {
        return acc;
      }

      // Add a spacer for black / white
      if (name === '--dh-color-black') {
        acc[group].push({ name: '', value: '' });
      }

      // Skip gray light/mid/dark as we are planning to remove them
      if (/^--dh-color-gray-(light|mid|dark)$/.test(name)) {
        return acc;
      }

      acc[group].push({ name, value });

      return acc;
    },
    {} as Record<string, { name: string; value: string }[]>
  );

  return groupData;
}
