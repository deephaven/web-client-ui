import { getExpressionRanges } from '@deephaven/components';
import { ColorUtils } from '@deephaven/utils';

export const INVALID_COLOR_BORDER_STYLE = '2px solid var(--dh-color-notice-bg)';

// Group names are extracted from var names via a regex capture group. Most of
// them work pretty well, but some need to be remapped to a more appropriate
// group.
const REASSIGN_VARIABLE_GROUPS: Record<string, string> = {
  '--dh-color-black': 'gray',
  '--dh-color-white': 'gray',
  // Semantic
  '--dh-color-border': 'General',
  '--dh-color-bg': 'General',
  '--dh-color-surface-bg': 'General',
  '--dh-color-fg': 'General',
  '--dh-color-content-bg': 'General',
  '--dh-color-subdued-content-bg': 'General',
  '--dh-color-dropshadow': 'General',
  '--dh-color-keyboard-selected-bg': 'Misc',
  '--dh-color-hover-border': 'Misc',
  '--dh-color-visual-positive': 'Visual Status',
  '--dh-color-visual-negative': 'Visual Status',
  '--dh-color-visual-notice': 'Visual Status',
  '--dh-color-visual-info': 'Visual Status',
  '--dh-color-gray-bg': 'Default Background',
  '--dh-color-red-bg': 'Default Background',
  '--dh-color-orange-bg': 'Default Background',
  '--dh-color-yellow-bg': 'Default Background',
  '--dh-color-chartreuse-bg': 'Default Background',
  '--dh-color-celery-bg': 'Default Background',
  '--dh-color-green-bg': 'Default Background',
  '--dh-color-seafoam-bg': 'Default Background',
  '--dh-color-cyan-bg': 'Default Background',
  '--dh-color-blue-bg': 'Default Background',
  '--dh-color-indigo-bg': 'Default Background',
  '--dh-color-purple-bg': 'Default Background',
  '--dh-color-fuchsia-bg': 'Default Background',
  '--dh-color-magenta-bg': 'Default Background',
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

const SWATCH_LABEL = {
  '--dh-color-black': '',
  '--dh-color-action-active-bg': 'Action.active',
  '--dh-color-action-down-bg': 'Action:active',
  '--dh-color-action-hover-bg': 'Action:hover',
  '--dh-color-action-active-hover-bg': 'Action.active:hover',
  '--dh-color-action-disabled-bg': 'Action:disabled',
};

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
  semantic: {},
  component: {},
} satisfies Record<string, Record<string, string>>;

/**
 * Return black or white contrast color.
 *
 * Note that this should be sufficient for styleguide swatch examples, but it
 * may not completely align with how Spectrum determines contrast colors, hence
 * leaving this here instead of promoting to `ColorUtils`.
 */
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
        const colorwayColors = getExpressionRanges(value ?? '').map(
          ([start, end]) => value.substring(start, end + 1)
        );
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
): Record<
  string,
  { isLabel?: boolean; name: string; value: string; note?: string }[]
> {
  const groupRemap: Record<string, string> = RENAME_VARIABLE_GROUPS[groupKey];
  const swatchData = extractColorVars(styleText);

  const groupData = swatchData.reduce(
    (acc, { name, value }) => {
      // Skip true black/white
      if (/^--dh-color-true-(.*?)$/.test(name)) {
        return acc;
      }

      // Skip gray light/mid/dark as they will be marked via notes on the gray
      // numbered palette
      if (/^--dh-color-gray-(light|mid|dark)$/.test(name)) {
        return acc;
      }

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

      // Add a spacer for black / white
      if (name in SWATCH_LABEL) {
        acc[group].push({
          isLabel: true,
          name: SWATCH_LABEL[name as keyof typeof SWATCH_LABEL],
          value: '',
        });
      }

      // Skip gray light/mid/dark as we are planning to remove them
      if (/^--dh-color-gray-(light|mid|dark)$/.test(name)) {
        return acc;
      }

      acc[group].push({ name, value });

      return acc;
    },
    {} as Record<
      string,
      { isLabel?: boolean; name: string; value: string; note?: string }[]
    >
  );

  return groupData;
}
