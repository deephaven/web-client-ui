/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import {
  View,
  RandomAreaPlotAnimation as Animation,
} from '@deephaven/components';
import { sampleSectionIdAndClasses } from './utils';

export function RandomAreaPlotAnimation(): JSX.Element {
  return (
    <div
      {...sampleSectionIdAndClasses('animations', [
        'sample-section-e2e-ignore',
      ])}
    >
      <h2 className="ui-title">Animations</h2>
      <View position="relative" height={400}>
        <Animation />
      </View>
    </div>
  );
}

export default RandomAreaPlotAnimation;
