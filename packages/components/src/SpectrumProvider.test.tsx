import React from 'react';
import { render } from '@testing-library/react';
import SpectrumProvider from './SpectrumProvider';

it.each([
  [true, 'transparent'],
  [false, ''],
] as const)(
  'should have transparent background when "transparentBackground" is true: %s',
  (transparentBackground, expected) => {
    const { container } = render(
      <SpectrumProvider transparentBackground={transparentBackground} />
    );
    const firstChild = container.firstChild as HTMLDivElement;
    expect(firstChild.style.backgroundColor).toEqual(expected);
  }
);
