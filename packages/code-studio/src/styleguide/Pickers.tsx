/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo } from 'react';
import { Item, Picker } from '@deephaven/components';
import { sampleSectionIdAndClasses } from './utils';

export function Pickers(): JSX.Element {
  const items = useMemo(
    () => [
      'x',
      'y',
      'z',
      4,
      9,
      <Item key="b" id="a">
        Aaa
      </Item>,
    ],
    []
  );

  return (
    <div {...sampleSectionIdAndClasses('pickers')}>
      <h2 className="ui-title">Pickers</h2>
      <Picker items={items} />
    </div>
  );
}

export default Pickers;
