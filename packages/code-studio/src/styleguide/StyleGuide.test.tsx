import React from 'react';
import { render } from '@testing-library/react';
import { dh } from '@deephaven/jsapi-shim';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import StyleGuide from './StyleGuide';

describe('<StyleGuide /> mounts', () => {
  test('h1 text of StyleGuide renders', () => {
    expect(() =>
      render(
        <ApiContext.Provider value={dh}>
          <StyleGuide />
        </ApiContext.Provider>
      )
    ).not.toThrow();
  });
});
