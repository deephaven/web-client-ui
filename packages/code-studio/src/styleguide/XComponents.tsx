import React, { useState } from 'react';
import {
  XComponentMapProvider,
  createXComponent,
  Button,
} from '@deephaven/components';
import SampleSection from './SampleSection';

type FooComponentProps = { value: string };

function FooComponent({ value }: FooComponentProps) {
  return (
    <Button kind="primary" onClick={() => undefined}>
      {value}
    </Button>
  );
}
FooComponent.displayName = 'FooComponent';

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
  return (
    <Button kind="danger" onClick={() => undefined}>
      {value.split('').reverse().join('')}
    </Button>
  );
}

/**
 * Some examples showing usage of XComponents.
 */
export function XComponents(): JSX.Element {
  const [value, setValue] = useState('hello');

  return (
    <SampleSection name="xcomponents">
      <h2 className="ui-title">XComponents</h2>
      <p>
        XComponents are a way to replace a component with another component
        without needing to pass props all the way down the component tree. This
        can be useful in cases where we have a component deep down in the
        component tree that we want to replace with a different component, but
        don&apos;t want to have to provide props at the top level just to hook
        into that.
        <br />
        Below is a component that is simply a button displaying the text
        inputted in the input field. We will replace this component with a new
        component that reverses the text, straight up, then in a nested
        scenario, and then multiple instances.
      </p>
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
    </SampleSection>
  );
}

export default XComponents;
