import React from 'react';
import { render } from '@testing-library/react';
import ChartColumnSelectorOverlay from './ChartColumnSelectorOverlay';

function makeChartColumnSelectorOverlay({
  onColumnSelected = jest.fn(),
  onMouseEnter = jest.fn(),
  onMouseLeave = jest.fn(),
  columns = [],
} = {}) {
  return render(
    <ChartColumnSelectorOverlay
      onColumnSelected={onColumnSelected}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      columns={columns}
    />
  );
}

it('mounts and unmounts successfully without crashing', () => {
  makeChartColumnSelectorOverlay();
});
