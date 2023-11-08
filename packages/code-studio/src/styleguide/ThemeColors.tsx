import React, { useMemo } from 'react';
import { Tooltip } from '@deephaven/components';
import { ColorUtils } from '@deephaven/utils';
import palette from '@deephaven/components/src/theme/theme-dark/theme-dark-palette.css?inline';
import semantic from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic.css?inline';
import chart from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic-chart.css?inline';
import semanticEditor from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic-editor.css?inline';
import semanticGrid from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic-grid.css?inline';
import components from '@deephaven/components/src/theme/theme-dark/theme-dark-components.css?inline';
import styles from './ThemeColors.module.scss';

// Group names are extracted from var names via a regex capture group. Most of
// them work pretty well, but some need to be remapped to a more appropriate
// group.
const reassignVarGroups: Record<string, string> = {
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
};

// Mappings of variable groups to rename
const renameGroups = {
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
};

export function ThemeColors(): JSX.Element {
  const swatchDataGroups = useMemo(
    () => ({
      'Theme Color Palette': buildColorGroups(palette, 1),
      'Semantic Colors': buildColorGroups(semantic, 1, renameGroups.semantic),
      'Chart Colors': buildColorGroups(chart, 2, renameGroups.chart),
      'Editor Colors': buildColorGroups(semanticEditor, 2, renameGroups.editor),
      'Grid Colors': buildColorGroups(semanticGrid, 2, renameGroups.grid),
      'Component Colors': buildColorGroups(components, 1),
    }),
    []
  );

  return (
    <>
      {Object.entries(swatchDataGroups).map(([label, data]) => (
        <div key={label}>
          <h2 className="ui-title">{label}</h2>
          <div className={styles.themeColors}>
            {Object.entries(data).map(([group, swatchData]) => (
              <div
                key={group}
                // This is the secret sauce for filling columns. The height of
                // each swatch group spans multiple rows (the number of swatches
                // + 1 for the label). This causes the grid to create rows
                // based on the swatch height (35px), and each swatch (also the
                // group label) neatly fits in a grid cell. The grid will put a
                // group in each column and then wrap back around to the first
                // until all groups are placed.
                style={{ gridRow: `span ${swatchData.length + 1}` }}
              >
                <span className={styles.label}>{group}</span>
                {swatchData.map(({ name, value }) => (
                  <div
                    key={name}
                    className={styles.swatch}
                    style={{
                      backgroundColor: value,
                      color: `var(--dh-color-${contrastColor(value)})`,
                    }}
                  >
                    <Tooltip>
                      <div>{name}</div>
                      <div>{value}</div>
                      <div>
                        {ColorUtils.normalizeCssColor(value).replace(
                          /^(#[a-f0-9]{6})ff$/,
                          '$1'
                        )}
                      </div>
                    </Tooltip>
                    <span>{name.replace('--dh-color-', '')}</span>
                    {name.endsWith('-hue') ? <span>{value}</span> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export default ThemeColors;

/** Return black or white contrast color */
function contrastColor(color: string): 'black' | 'white' {
  const rgba = ColorUtils.parseRgba(ColorUtils.asRgbOrRgbaString(color) ?? '');
  if (rgba == null || rgba.a < 0.5) {
    return 'white';
  }

  const { r, g, b } = rgba;
  const y = (299 * r + 587 * g + 114 * b) / 1000;
  return y >= 128 ? 'black' : 'white';
}

/** Extract an array of { name, value } pairs for css variables in a given string  */
function extractColorVars(
  styleText: string
): { name: string; value: string }[] {
  const computedStyle = getComputedStyle(document.documentElement);

  return styleText
    .split('\n')
    .map(line => /^\s{2}(--dh-color-(?:[^:]+))/.exec(line)?.[1])
    .filter((match): match is string => Boolean(match))
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
function buildColorGroups(
  styleText: string,
  captureGroupI: number,
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

      // Add a spacer for black / white
      if (name === '--dh-color-black') {
        acc[group].push({ name: '', value: '' });
      }

      acc[group].push({ name, value });

      return acc;
    },
    {} as Record<string, { name: string; value: string }[]>
  );

  return groupData;
}
