import React from 'react';
import classNames from 'classnames';

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
    '900',
  ].map(swatch => (
    <div
      key={swatch}
      className={classNames('swatch', 'gray-swatch', `gray-swatch-${swatch}`)}
    >
      Gray-
      {swatch}
    </div>
  ));

  const colorSwatches = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'white',
    'black',
    'content-bg',
    'primary',
    'primary-dark',
    'background',
    'foreground',
  ].map(swatch => (
    <div key={swatch} className={classNames('swatch', `swatch-${swatch}`)}>
      {swatch}
    </div>
  ));

  return (
    <div>
      <h2 className="ui-title">Colors</h2>
      <div className="row">
        <div className="col">{graySwatches}</div>

        <div className="col">{colorSwatches}</div>

        <div className="col">
          <p>
            Gray Range is available for background/tab colors, and should cover
            the full range used in mockups. Always use the semantic color names
            in your .scss files when applicable for UI elements.
          </p>
          <p>
            For refrence key colors are $primary for interactable elements,
            content-bg as background. White is same as gray-200. Gray-100 is
            used when white needs an active color. content-bg is between 800 and
            900.
          </p>
          <pre>
            {`
// as semantic colours
$primary: $interfaceblue;
$secondary: $gray-600;
$content-bg: $interfacegray;
$foreground: $interfacewhite;
$background: $interfaceblack;
$success: $green;
$info: $yellow;
$warning: $orange;
$danger: $red;
`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default Colors;
