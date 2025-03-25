/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-unused-state */
import React, { Component, type ReactElement, type RefObject } from 'react';
import Log from '@deephaven/log';
import ConnectedIrisGridPanel, {
  type IrisGridPanel,
  type OwnProps as IrisGridPanelOwnProps,
  type PanelState,
} from './IrisGridPanel';

const log = Log.module('SimplePivotPanel');

export interface SimplePivotPanelProps extends IrisGridPanelOwnProps {
  panelState: PanelState | null;
}

interface SimplePivotPanelState {
  shouldFocusGrid: boolean;
  panelState: PanelState | null;
}

/**
 * Wraps and IrisGridPanel to add a refresh button for SimplePivot.
 */
class SimplePivotPanel extends Component<
  SimplePivotPanelProps,
  SimplePivotPanelState
> {
  static defaultProps = {
    panelState: null,
  };

  static COMPONENT = 'SimplePivotPanel';

  constructor(props: SimplePivotPanelProps) {
    super(props);

    log.debug('[0] constructor');

    this.irisGridRef = React.createRef();

    this.handleReload = this.handleReload.bind(this);
    this.handleGridStateChange = this.handleGridStateChange.bind(this);
    this.handlePanelStateUpdate = this.handlePanelStateUpdate.bind(this);

    const { panelState } = props;
    this.state = {
      shouldFocusGrid: false,
      panelState, // Dehydrated panel state that can load this panel
    };
  }

  irisGridRef: RefObject<IrisGridPanel>;

  handleReload(): void {
    this.irisGridRef.current?.initModel();
    this.setState({
      shouldFocusGrid: true,
    });
  }

  handleGridStateChange(): void {
    const { shouldFocusGrid } = this.state;
    if (shouldFocusGrid && this.irisGridRef.current?.irisGrid?.current?.grid) {
      this.irisGridRef.current.irisGrid.current.grid.focus();
      this.setState({
        shouldFocusGrid: false,
      });
    }
  }

  handlePanelStateUpdate(panelState: PanelState): void {
    this.setState({
      panelState,
    });
  }

  render(): ReactElement {
    return (
      <ConnectedIrisGridPanel
        ref={this.irisGridRef}
        onStateChange={this.handleGridStateChange}
        onPanelStateUpdate={this.handlePanelStateUpdate}
        {...this.props}
      />
    );
  }
}

export default SimplePivotPanel;
