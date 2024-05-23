import { Flex, Grid, View } from '@deephaven/components';
import type { StyleProps } from '@react-types/shared';
import React, { CSSProperties, ReactNode } from 'react';
import {
  getSectionIdFromName,
  sampleSectionIdAndClasses,
  sampleSectionIdAndClassesSpectrum,
  useIsolateSectionHash,
} from './utils';

export interface SampleSectionProps extends StyleProps {
  name: string;
  className?: string;
  component?: 'div' | typeof Flex | typeof Grid | typeof View;
  style?: CSSProperties;
  children: ReactNode;
}

export function SampleSection({
  name,
  className = '',
  component: Component = 'div',
  ...styleProps
}: SampleSectionProps): JSX.Element | null {
  const hash = useIsolateSectionHash();
  const sectionId = getSectionIdFromName(name);
  const shouldRender = hash === '' || hash === sectionId;

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
      {...sectionIdAndClasses(name, [className])}
    />
  );
}

export default SampleSection;
