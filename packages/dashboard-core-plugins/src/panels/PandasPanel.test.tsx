import React from 'react';
import { render } from '@testing-library/react';
import PandasPanel from './PandasPanel';
import { type PanelState } from './IrisGridPanel';

const events: string[] = [];

jest.mock('./IrisGridPanel', () => {
  const { Component } = jest.requireActual('react');

  /** Stands in for IrisGridPanel, with a debounced save still pending */
  class MockIrisGridPanel extends Component<{
    onPanelStateUpdate: (panelState: unknown) => void;
  }> {
    componentWillUnmount(): void {
      events.push('grid unmount');
      this.flushPanelState();
    }

    pendingPanelState: unknown = 'pending';

    flushPanelState(): void {
      const { onPanelStateUpdate } = this.props;
      if (this.pendingPanelState != null) {
        onPanelStateUpdate(this.pendingPanelState);
        this.pendingPanelState = null;
      }
    }

    render(): null {
      return null;
    }
  }

  return { __esModule: true, default: MockIrisGridPanel };
});

beforeEach(() => {
  events.length = 0;
});

it('saves the grid pending panel state before the grid unmounts', () => {
  // Golden Layout only saves state set while the panel itself unmounts, which
  // is before its children unmount
  const handlePanelStateUpdate = jest
    .spyOn(PandasPanel.prototype, 'handlePanelStateUpdate')
    .mockImplementation((panelState: PanelState) => {
      events.push(`save ${panelState}`);
    });
  const props = { makeModel: jest.fn() } as unknown as React.ComponentProps<
    typeof PandasPanel
  >;
  // eslint-disable-next-line react/jsx-props-no-spreading
  const { unmount } = render(<PandasPanel {...props} />);

  unmount();

  expect(events).toEqual(['save pending', 'grid unmount']);
  handlePanelStateUpdate.mockRestore();
});
