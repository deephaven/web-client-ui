/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-unused-state */
import React, { Component, type ReactElement, type RefObject } from 'react';
import { IrisGridModel } from '@deephaven/iris-grid';
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
  makeModel: IrisGridPanelOwnProps['makeModel'];
}

/**
 * Wraps and IrisGridPanel to add a refresh button for Pandas.
 */
class PandasPanel extends Component<PandasPanelProps, PandasPanelState> {
  static defaultProps = {
    panelState: null,
  };

  static COMPONENT = 'PandasPanel';

  // eslint-disable-next-line react/sort-comp
  private irisGridRef: RefObject<IrisGridPanel>;

  private model: IrisGridModel | null = null;

  constructor(props: PandasPanelProps) {
    super(props);

    this.irisGridRef = React.createRef();

    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleReload = this.handleReload.bind(this);
    this.handleGridStateChange = this.handleGridStateChange.bind(this);
    this.handlePanelStateUpdate = this.handlePanelStateUpdate.bind(this);

    const { panelState } = props;
    this.state = {
      shouldFocusGrid: false,
      panelState, // Dehydrated panel state that can load this panel
      makeModel: this.wrapMakeModel(props.makeModel),
    };
  }

  componentDidUpdate(prevProps: Readonly<PandasPanelProps>): void {
    const { makeModel: prevMakeModel } = prevProps;
    const { makeModel } = this.props;
    if (prevMakeModel !== makeModel) {
      this.setState({ makeModel: this.wrapMakeModel(makeModel) });
    }
  }

  componentWillUnmount(): void {
    if (this.model != null) {
      this.stopListening(this.model);
    }
  }

  private wrapMakeModel(
    makeModel: IrisGridPanelOwnProps['makeModel']
  ): IrisGridPanelOwnProps['makeModel'] {
    return async () => {
      // Need to listen for disconnect in the model, so we know when to throw this makeModel away
      const model = await makeModel();
      if (this.model != null) {
        this.stopListening(this.model);
      }
      this.model = model;
      this.startListening(model);
      return model;
    };
  }

  private startListening(model: IrisGridModel): void {
    model.addEventListener(
      IrisGridModel.EVENT.DISCONNECT,
      this.handleDisconnect
    );
  }

  private stopListening(model: IrisGridModel): void {
    model.removeEventListener(
      IrisGridModel.EVENT.DISCONNECT,
      this.handleDisconnect
    );
  }

  private handleDisconnect(): void {
    // Once a Pandas widget is closed, the underlying table is closed and cannot be reconnected to.
    // Reset the model to undefined so IrisGridPanel doesn't try to use it anymore.
    this.irisGridRef.current?.setState({ model: undefined });
  }

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
    const { makeModel } = this.state;
    return (
      <ConnectedIrisGridPanel
        ref={this.irisGridRef}
        onStateChange={this.handleGridStateChange}
        onPanelStateUpdate={this.handlePanelStateUpdate}
        {...this.props}
        makeModel={makeModel}
      >
        <PandasReloadButton onClick={this.handleReload} />
      </ConnectedIrisGridPanel>
    );
  }
}

export default PandasPanel;
