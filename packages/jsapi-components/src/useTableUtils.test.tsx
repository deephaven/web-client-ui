import React from 'react';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import dh from '@deephaven/jsapi-shim';
import { TableUtils } from '@deephaven/jsapi-utils';
import { renderHook } from '@testing-library/react-hooks';
import useTableUtils from './useTableUtils';

const wrapper = ({ children }) => (
  <ApiContext.Provider value={dh}>{children}</ApiContext.Provider>
);

it('should return a TableUtils instance based on the current dh api context', () => {
  const { result } = renderHook(() => useTableUtils(), { wrapper });
  expect(result.current.dh).toBe(dh);
  expect(result.current).toBeInstanceOf(TableUtils);
});
