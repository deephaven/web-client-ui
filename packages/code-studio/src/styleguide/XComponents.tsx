import React, { useState } from 'react';
import {
  XComponentMapProvider,
  createXComponent,
  View,
  Button,
} from '@deephaven/components';
import { sampleSectionIdAndClasses } from './utils';

type FooComponentProps = { value: string };

function FooComponent({ value }: FooComponentProps) {
  return <Button kind="primary">{value}</Button>;
}

// Create an XComponent from FooComponent to allow for replacement
const XFooComponent = createXComponent(FooComponent);

function NestedFooComponent({ value }: FooComponentProps) {
  // We're using the XComponent version so this panel can be replaced if it is mapped from a parent context to a replacement
  return <XFooComponent value={`${value}.${value}`} />;
}

function MultiFooComponent({ value }: FooComponentProps) {
  // Show multiple instances getting replaced
  return (
    <div>
      <XFooComponent value={value} />
      <XFooComponent value={value} />
    </div>
  );
}

// What we're replacing the XFooComponent with.
function ReverseFooComponent({ value }: FooComponentProps) {
  return <Button kind="danger">{value.split('').reverse().join('')}</Button>;
}

/**
 * Some examples showing usage of XComponents.
 */
export function XComponents(): JSX.Element {
  const [value, setValue] = useState('hello');

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...sampleSectionIdAndClasses('xcomponents')}>
      <h2 className="ui-title">XComponents</h2>
      <div className="form-group">
        <label htmlFor="xcomponentsInput">
          Input Value:
          <input
            type="text"
            className="form-control"
            id="xcomponentsInput"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
        </label>
      </div>
      <div className="row">
        <div className="col">
          <small>Original Component</small>
          <div>
            <XFooComponent value={value} />
          </div>

          <small>Replaced with Reverse</small>
          <div>
            <XComponentMapProvider
              value={new Map([[XFooComponent, ReverseFooComponent]])}
            >
              <XFooComponent value={value} />
            </XComponentMapProvider>
          </div>
        </div>
        <div className="col">
          <small>Nested component replaced</small>
          <div>
            <XComponentMapProvider
              value={new Map([[XFooComponent, ReverseFooComponent]])}
            >
              {/* The `FooComponent` that gets replaced is from within the `NestedFooComponent` */}
              <NestedFooComponent value={value} />
            </XComponentMapProvider>
          </div>
        </div>
        <div className="col">
          <small>Multiple Components replaced</small>
          <div>
            <XComponentMapProvider
              value={new Map([[XFooComponent, ReverseFooComponent]])}
            >
              <MultiFooComponent value={value} />
            </XComponentMapProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

export default XComponents;
