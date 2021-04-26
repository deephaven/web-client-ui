/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-unused-state */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhRefresh } from '@deephaven/icons';
import { Tooltip } from '@deephaven/components';
import IrisGridPanel from './IrisGridPanel';
import './PandasPanel.scss';

/**
 * Wraps and IrisGridPanel to add a refresh button for Pandas.
 */
class PandasPanel extends Component {
  constructor(props) {
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

  handleReload() {
    this.irisGridRef.current.initModel();
    this.buttonRef.current.blur();
    this.setState({
      shouldFocusGrid: true,
    });
  }

  handleGridStateChange() {
    const { shouldFocusGrid } = this.state;
    if (shouldFocusGrid && this.irisGridRef.current?.irisGrid?.current?.grid) {
      this.irisGridRef.current.irisGrid.current.grid.focus();
      this.setState({
        shouldFocusGrid: false,
      });
    }
  }

  handlePanelStateUpdate(panelState) {
    this.setState({
      panelState,
    });
  }

  render() {
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

PandasPanel.propTypes = {
  panelState: PropTypes.shape({}),
};

PandasPanel.defaultProps = {
  panelState: null,
};

export default PandasPanel;
