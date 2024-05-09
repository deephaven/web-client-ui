import React from 'react';
import {
  View,
  RandomAreaPlotAnimation as Animation,
} from '@deephaven/components';
import SampleSection from './SampleSection';

export function RandomAreaPlotAnimation(): JSX.Element {
  return (
    <SampleSection sectionId="animations" className="sample-section-e2e-ignore">
      <h2 className="ui-title">Animations</h2>
      <View position="relative" height={400}>
        <Animation />
      </View>
    </SampleSection>
  );
}

export default RandomAreaPlotAnimation;
