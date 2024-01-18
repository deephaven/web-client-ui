/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import classNames from 'classnames';
import { sampleSectionIdAndClasses } from './utils';
import { Swatch } from './Swatch';

function Colors(): React.ReactElement {
  const graySwatches = [
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '850',
    '8XX',
    '900',
  ].map(swatch => (
    <Swatch
      key={swatch}
      className={classNames('swatch', 'gray-swatch', `gray-swatch-${swatch}`)}
    >
      {swatch === '8XX' ? 'N/A' : `Gray-${swatch}`}
    </Swatch>
  ));

  const baseColorPaletteSwatches = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'white',
    'black',
  ].map(swatch => (
    <Swatch key={swatch} className={classNames('swatch', `swatch-${swatch}`)}>
      {swatch}
    </Swatch>
  ));

  const colorSwatches = [
    'content-bg',
    'background',
    'foreground',
    'primary',
    'primary-dark',
    'secondary',
    'secondary-hover',
    'success',
    'info',
    'warning',
    'danger',
    'danger-hover',
  ].map(swatch => (
    <Swatch key={swatch} className={classNames('swatch', `swatch-${swatch}`)}>
      {swatch}
    </Swatch>
  ));

  return (
    <div {...sampleSectionIdAndClasses('colors')}>
      <h2 className="ui-title">Colors</h2>
      <div className="row">
        <div className="col">
          {graySwatches}
          {baseColorPaletteSwatches}
        </div>

        <div className="col">{colorSwatches}</div>

        <div className="col">
          <p>
            This section is for legacy reference only. Use the css variable
            based semantic colors in the following sections. You should not be
            using colors defined in the theme color palette directly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Colors;
