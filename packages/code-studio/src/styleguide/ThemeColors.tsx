/* eslint-disable react/jsx-props-no-spreading */
import React, { Fragment, useMemo } from 'react';
import cl from 'classnames';
import { CopyButton, Tooltip, useTheme } from '@deephaven/components';
import { ColorUtils } from '@deephaven/utils';
import palette from '@deephaven/components/src/theme/theme-dark/theme-dark-palette.css?inline';
import semantic from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic.css?inline';
import chart from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic-chart.css?inline';
import semanticEditor from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic-editor.css?inline';
import semanticGrid from '@deephaven/components/src/theme/theme-dark/theme-dark-semantic-grid.css?inline';
import components from '@deephaven/components/src/theme/theme-dark/theme-dark-components.css?inline';
import styles from './ThemeColors.module.scss';
import { sampleSectionIdAndClasses, useIsHash } from './utils';
import {
  buildColorGroups,
  contrastColor,
  INVALID_COLOR_BORDER_STYLE,
} from './colorUtils';

function buildSwatchDataGroups() {
  return {
    'Theme Color Palette': buildColorGroups('palette', palette, 1),
    'Semantic Colors': buildColorGroups('semantic', semantic, 1),
    'Chart Colors': buildColorGroups('chart', chart, 2),
    'Editor Colors': buildColorGroups('editor', semanticEditor, 2),
    'Grid Colors': buildColorGroups('grid', semanticGrid, 2),
    'Component Colors': buildColorGroups('component', components, 1),
  };
}

export function ThemeColors(): JSX.Element {
  const isHash = useIsHash();
  const { selectedThemeKey } = useTheme();
  const swatchDataGroups = useMemo(buildSwatchDataGroups, [selectedThemeKey]);

  return (
    <>
      {Object.entries(swatchDataGroups).map(([label, data], i) => {
        if (label === 'Theme Color Palette' && isHash('theme-color-palette')) {
          return (
            <div key={label} {...sampleSectionIdAndClasses(label)}>
              <h2 className="ui-title">{label}</h2>

              <div className={styles.themeColorsPalette}>
                {Object.entries(data).map(([group, swatchData], index) => (
                  <Fragment key={group}>
                    {(index === 0 || index === 1) &&
                      swatchData.map(({ name }, j) => (
                        <div
                          style={{
                            gridColumnStart: j + 2,
                            textAlign: 'center',
                          }}
                          className="mt-3"
                          key={name}
                        >
                          {name.split('-').pop()}
                        </div>
                      ))}
                    <div className="text-right pr-2">{group}</div>
                    {swatchData.map(({ name, value }) => (
                      <div
                        key={name}
                        style={{
                          backgroundColor: value,
                          border:
                            value === '' && name.length > 0
                              ? INVALID_COLOR_BORDER_STYLE
                              : undefined,
                          color: `var(--dh-color-${contrastColor(value)})`,
                        }}
                        className={cl(styles.swatch, 'px-0')}
                      >
                        <Tooltip interactive>
                          <div>{name}</div>
                          <div>{value}</div>
                          <div>{ColorUtils.normalizeCssColor(value, true)}</div>
                        </Tooltip>
                        <CopyButton
                          copy={name}
                          style={{
                            color: `var(--dh-color-${contrastColor(value)})`,
                          }}
                        />
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
          );
        }
        if (!isHash(label, true)) return null;
        return (
          <div key={label} {...sampleSectionIdAndClasses(label)}>
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
                  <span className={cl(styles.label, styles.capitalize)}>
                    {group}
                  </span>
                  {swatchData.map(({ isLabel, name, value, note }) =>
                    isLabel === true ? (
                      <span key={name} className={styles.label}>
                        {name}
                      </span>
                    ) : (
                      <div
                        key={name}
                        className={styles.swatch}
                        style={{
                          backgroundColor: value,
                          border:
                            value === '' && name.length > 0
                              ? INVALID_COLOR_BORDER_STYLE
                              : undefined,
                          color: `var(--dh-color-${contrastColor(value)})`,
                        }}
                      >
                        <Tooltip interactive>
                          <div>{name}</div>
                          <div>{value}</div>
                          <div>{ColorUtils.normalizeCssColor(value, true)}</div>
                        </Tooltip>
                        <span>{name.replace('--dh-color-', '')}</span>
                        {name.endsWith('-hue') || note != null ? (
                          <span>{note ?? value}</span>
                        ) : null}
                        <CopyButton
                          copy={name}
                          style={{
                            color: `var(--dh-color-${contrastColor(value)})`,
                          }}
                        />
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default ThemeColors;
