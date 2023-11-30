import { ColorUtils } from '@deephaven/utils';

export const INVALID_COLOR_BORDER_STYLE =
  '2px solid var(--dh-color-notice-default-bg)';

// Group names are extracted from var names via a regex capture group. Most of
// them work pretty well, but some need to be remapped to a more appropriate
// group.
const REASSIGN_VARIABLE_GROUPS: Record<string, string> = {
  '--dh-color-black': 'gray',
  '--dh-color-white': 'gray',
  // Semantic
  '--dh-color-visual-positive': 'Visual Status',
  '--dh-color-visual-negative': 'Visual Status',
  '--dh-color-visual-notice': 'Visual Status',
  '--dh-color-visual-info': 'Visual Status',
  // Editor
  '--dh-color-editor-bg': 'editor',
  '--dh-color-editor-fg': 'editor',
  '--dh-color-editor-context-menu-bg': 'menus',
  '--dh-color-editor-context-menu-fg': 'menus',
  '--dh-color-editor-menu-selection-bg': 'menus',
  // Grid
  '--dh-color-grid-bg': 'grid',
  '--dh-color-grid-number-positive': 'Data Types',
  '--dh-color-grid-number-negative': 'Data Types',
  '--dh-color-grid-number-zero': 'Data Types',
  '--dh-color-grid-date': 'Data Types',
  '--dh-color-grid-string-null': 'Data Types',
} as const;

// Mappings of variable groups to rename
const RENAME_VARIABLE_GROUPS = {
  palette: {
    black: 'gray',
    white: 'gray',
  },
  editor: {
    line: 'editor',
    comment: 'code',
    string: 'code',
    number: 'code',
    delimiter: 'code',
    identifier: 'code',
    keyword: 'code',
    operator: 'code',
    storage: 'code',
    predefined: 'code',
    selection: 'state',
    focus: 'state',
  },
  chart: {
    axis: 'Chart',
    bg: 'Chart',
    grid: 'Chart',
    plot: 'Chart',
    title: 'Chart',
    active: 'Data',
    trend: 'Data',
    area: 'Data',
    range: 'Data',
    line: 'Deprecated',
  },
  grid: { data: 'Data Bars', context: 'Context Menu' },
  semantic: {
    positive: 'status',
    negative: 'status',
    notice: 'status',
    info: 'status',
    well: 'wells',
  },
  component: {},
} satisfies Record<string, Record<string, string>>;

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
  groupKey: keyof typeof RENAME_VARIABLE_GROUPS,
  styleText: string,
  captureGroupI: number,
  reassignVarGroups: Record<string, string> = REASSIGN_VARIABLE_GROUPS
): Record<string, { name: string; value: string }[]> {
  const groupRemap: Record<string, string> = RENAME_VARIABLE_GROUPS[groupKey];
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
