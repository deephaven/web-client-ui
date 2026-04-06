import React from 'react';
import { render } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import { Formatter } from '@deephaven/jsapi-utils';
import { EMPTY_ARRAY } from '@deephaven/utils';
import IrisGridModelUpdater from './IrisGridModelUpdater';
import IrisGridTestUtils from './IrisGridTestUtils';

const irisGridTestUtils = new IrisGridTestUtils(dh);

function makeModel() {
  return irisGridTestUtils.makeModel();
}

function renderUpdater(propsOverride = {}) {
  const model = makeModel();
  const defaultProps = {
    model,
    top: 0,
    bottom: 100,
    left: 0,
    right: 10,
    filter: EMPTY_ARRAY as readonly dh.FilterCondition[],
    sorts: EMPTY_ARRAY as readonly never[],
    customColumns: EMPTY_ARRAY as readonly string[],
    movedColumns: EMPTY_ARRAY as readonly never[],
    hiddenColumns: EMPTY_ARRAY as readonly number[],
    alwaysFetchColumns: EMPTY_ARRAY as readonly string[],
    formatColumns: EMPTY_ARRAY as readonly dh.CustomColumn[],
    columnHeaderGroups: EMPTY_ARRAY as readonly never[],
    formatter: new Formatter(dh),
    columnAlignmentMap: new Map<string, CanvasTextAlign>(),
  };
  return render(<IrisGridModelUpdater {...defaultProps} {...propsOverride} />);
}

describe('IrisGridModelUpdater', () => {
  it('renders without error when sorts and customColumns are provided', () => {
    expect(() => renderUpdater()).not.toThrow();
  });

  it('does not throw when sorts is undefined', () => {
    // This simulates what happens when LazyIrisGrid passes through props
    // without defaultProps being applied — sorts ends up undefined in state,
    // and IrisGridModelUpdater receives undefined for sorts
    expect(() => renderUpdater({ sorts: undefined as unknown })).not.toThrow();
  });

  it('does not throw when customColumns is undefined', () => {
    expect(() =>
      renderUpdater({ customColumns: undefined as unknown })
    ).not.toThrow();
  });

  it('does not throw when both sorts and customColumns are undefined', () => {
    expect(() =>
      renderUpdater({
        sorts: undefined as unknown,
        customColumns: undefined as unknown,
      })
    ).not.toThrow();
  });
});
