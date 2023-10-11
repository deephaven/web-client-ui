import React, { useMemo } from 'react';
import { Tooltip } from '@deephaven/components';
import { ColorUtils } from '@deephaven/utils';
import palette from '@deephaven/components/src/theme/theme-dark/theme-dark-palette.css?inline';
import semantic from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic.css?inline';
import semanticEditor from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic-editor.css?inline';
import styles from './ThemeColors.module.scss';

export function ThemeColors(): JSX.Element {
  const swatchDataGroups = useMemo(
    () => ({
      'Theme Color Palette': buildColorGroups(palette, 1),
      'Semantic Colors': buildColorGroups(semantic, 1),
      'Semantic Editor Colors': buildColorGroups(semanticEditor, 2),
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
  if (rgba == null) {
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
    .map(line => /^\s*(--dh-color-(?:[^:]+))/.exec(line)?.[1])
    .filter(Boolean)
    .map(varName =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ({ name: varName!, value: computedStyle.getPropertyValue(varName!)! })
    );
}

/** Group color data based on capture group value */
function buildColorGroups(
  styleText: string,
  captureGroupI: number
): Record<string, { name: string; value: string }[]> {
  const swatchData = extractColorVars(styleText);

  const groupData = swatchData.reduce(
    (acc, { name, value }) => {
      const match = /^--dh-color-([^-]+)(?:-([^-]+))?/.exec(name);
      const group = (match?.[captureGroupI] ?? match?.[1] ?? '...').replace(
        // special case black / white to include them with grays
        /(black)|(white)/,
        'gray'
      );

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
