import { Flex, Grid, View } from '@deephaven/components';
import type { StyleProps } from '@react-types/shared';
import React, { CSSProperties, ReactNode, useEffect, useState } from 'react';
import {
  sampleSectionIdAndClasses,
  sampleSectionIdAndClassesSpectrum,
} from './utils';

export interface SampleSectionProps extends StyleProps {
  sectionId: string;
  className?: string;
  component?: 'div' | typeof Flex | typeof Grid | typeof View;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * If isolatedSection=true, return the current location hash. Otherwise ''
 */
function getIsolatedHash() {
  const isolateSection = window.location.search.includes('isolateSection=true');
  return isolateSection ? window.location.hash.replace(/^#/, '') : '';
}

export function SampleSection({
  sectionId,
  className = '',
  component: Component = 'div',
  ...styleProps
}: SampleSectionProps): JSX.Element | null {
  const [hash, setHash] = useState(getIsolatedHash);

  useEffect(() => {
    const hashChangeHandler = () => setHash(getIsolatedHash());

    window.addEventListener('hashchange', hashChangeHandler);

    return () => window.removeEventListener('hashchange', hashChangeHandler);
  }, []);

  const shouldRender = hash === '' || hash === `sample-section-${sectionId}`;

  if (!shouldRender) {
    return null;
  }

  const sectionIdAndClasses =
    Component === 'div'
      ? sampleSectionIdAndClasses
      : sampleSectionIdAndClassesSpectrum;

  return (
    <Component
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...sectionIdAndClasses(sectionId, [className])}
    />
  );
}

export default SampleSection;
