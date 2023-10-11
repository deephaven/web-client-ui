import React, { useMemo } from 'react';
import { Tooltip } from '@deephaven/components';
import { ColorUtils } from '@deephaven/utils';
import palette from '@deephaven/components/src/theme/theme-dark/theme-dark-palette.css?inline';
import semantic from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic.css?inline';
import semanticEditor from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic-editor.css?inline';
import semanticGrid from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic-grid.css?inline';
import styles from './ThemeColors.module.scss';

const specialGroups: Record<string, string> = {
  '--dh-color-black': 'gray',
  '--dh-color-white': 'gray',
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

export function ThemeColors(): JSX.Element {
  const swatchDataGroups = useMemo(
    () => ({
      'Theme Color Palette': buildColorGroups(palette, 1),
      'Semantic Colors': buildColorGroups(semantic, 1),
      'Editor Colors': buildColorGroups(semanticEditor, 2, {
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
      }),
      'Grid Colors': buildColorGroups(semanticGrid, 2, { data: 'Data Bars' }),
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
                // the swatch group spans the number of swatches + 1 for the label
                // This causes the grid to create a rows with the swatch height
                // (35px), and each swatch + label group neatly fits in a cell.
                style={{ gridRow: `span ${swatchData.length + 1}` }}
              >
                <span className={styles.label}>{group}</span>
                {swatchData.map(({ name, value }) => (
                  <div
                    key={name}
                    className="swatch"
                    style={{
                      backgroundColor: value,
                      color: `var(--dh-color-${contrastColor(value)})`,
                    }}
                  >
                    <Tooltip>{`${name}: ${value}`}</Tooltip>
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
    .filter(Boolean)
    .map(varName =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ({ name: varName!, value: computedStyle.getPropertyValue(varName!)! })
    );
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
        specialGroups[name] ?? match?.[captureGroupI] ?? match?.[1] ?? '???';

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
