/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-unused-state */
import React, { Component, ReactElement, RefObject } from 'react';
import ConnectedIrisGridPanel, {
  type IrisGridPanel,
  type OwnProps as IrisGridPanelOwnProps,
  type PanelState,
} from './IrisGridPanel';
import { PandasReloadButton } from './PandasReloadButton';
import './PandasPanel.scss';

export interface PandasPanelProps extends IrisGridPanelOwnProps {
  panelState: PanelState | null;
}

interface PandasPanelState {
  shouldFocusGrid: boolean;
  panelState: PanelState | null;
}

/**
 * Wraps and IrisGridPanel to add a refresh button for Pandas.
 */
class PandasPanel extends Component<PandasPanelProps, PandasPanelState> {
  static defaultProps = {
    panelState: null,
  };

  static COMPONENT = 'PandasPanel';

  constructor(props: PandasPanelProps) {
    super(props);

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
      >
        <PandasReloadButton onClick={this.handleReload} />
      </ConnectedIrisGridPanel>
    );
  }
}

export default PandasPanel;
