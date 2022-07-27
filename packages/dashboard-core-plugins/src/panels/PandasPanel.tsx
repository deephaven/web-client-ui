/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-unused-state */
import React, { Component, ReactElement, RefObject } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhRefresh } from '@deephaven/icons';
import { Tooltip } from '@deephaven/components';
import { CommandHistoryTable } from '@deephaven/console';
import IrisGridPanel from './IrisGridPanel';
import './PandasPanel.scss';

export interface PanelState {
  CommandHistoryTable?: CommandHistoryTable;
  content?: string;
  name?: string;
  type?: string;
  value?: string;
  isValueShown?: boolean;
  timestamp?: number;
  selectedId?: string;
}

interface PandasPanelProps {
  panelState: PanelState;
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
    this.buttonRef = React.createRef();

    this.handleReload = this.handleReload.bind(this);
    this.handleGridStateChange = this.handleGridStateChange.bind(this);
    this.handlePanelStateUpdate = this.handlePanelStateUpdate.bind(this);

    const { panelState } = props;
    this.state = {
      shouldFocusGrid: false,
      panelState, // Dehydrated panel state that can load this panel
    };
  }

  buttonRef: RefObject<HTMLButtonElement>;

  irisGridRef: RefObject<IrisGridPanel>;

  handleReload(): void {
    this.irisGridRef.current?.initModel();
    this.buttonRef.current?.blur();
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
    const { ...props } = this.props;

    return (
      <IrisGridPanel
        ref={this.irisGridRef}
        onStateChange={this.handleGridStateChange}
        onPanelStateUpdate={this.handlePanelStateUpdate}
        {...props}
      >
        <button
          ref={this.buttonRef}
          type="button"
          className="btn btn-primary btn-pandas"
          onClick={this.handleReload}
        >
          pandas dataframe
          <span>
            <FontAwesomeIcon
              icon={dhRefresh}
              transform="shrink-1"
              className="mr-1"
            />
            Reload
          </span>
          <Tooltip>
            Click to refresh pandas dataframe, updates do not occur
            automatically.
          </Tooltip>
        </button>
      </IrisGridPanel>
    );
  }
}

export default PandasPanel;
