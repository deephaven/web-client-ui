import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import { GLPropTypes } from '@deephaven/dashboard';
import Panel from './Panel';
import InputFilter from '../controls/input-filter/InputFilter';
import { InputFilterEvent } from '../events';
import { getColumnsForDashboard } from '../redux';

const INPUT_FILTER_DEBOUNCE = 250;

class InputFilterPanel extends Component {
  static COMPONENT = 'InputFilterPanel';

  constructor(props) {
    super(props);

    this.handleChange = debounce(
      this.handleChange.bind(this),
      INPUT_FILTER_DEBOUNCE
    );
    this.handleClearAllFilters = this.handleClearAllFilters.bind(this);

    this.inputFilterRef = React.createRef();

    const { panelState } = props;
    // if panelstate is null, use destructured defaults
    const { value = null, isValueShown = false, name, type, timestamp = null } =
      panelState ?? {};

    this.state = {
      columns: [],
      column: name && type ? { name, type } : null,
      value,
      timestamp,
      isValueShown,
      wasFlipped: false,
      skipUpdate: false,
      // eslint-disable-next-line react/no-unused-state
      panelState, // Dehydrated panel state that can load this panel
    };
  }

  componentDidMount() {
    this.updateColumns();

    const { column, value, timestamp } = this.state;
    if (column != null) {
      const { name, type } = column;
      this.sendUpdate(name, type, value, timestamp);
    }
  }

  componentDidUpdate(prevProps) {
    const { columns } = this.props;
    if (columns !== prevProps.columns) {
      this.updateColumns();
    }
  }

  handleChange({ column, isValueShown, value }) {
    const { name, type } = column;
    let sendUpdate = true;
    let timestamp = Date.now();
    this.setState(
      ({ panelState, timestamp: prevTimestamp, wasFlipped, skipUpdate }) => {
        // If the user had a value set, and they flip the card over and flip it back without changing any settings, ignore it
        const isFlip =
          panelState != null &&
          isValueShown !== panelState.isValueShown &&
          name === panelState.name &&
          type === panelState.type &&
          value === panelState.value;
        sendUpdate = !skipUpdate && isValueShown && (!isFlip || !wasFlipped);

        if (!sendUpdate) {
          timestamp = prevTimestamp;
        }

        return {
          panelState: {
            isValueShown,
            name,
            type,
            value,
            timestamp,
          },
          timestamp,
          wasFlipped: isFlip,
          skipUpdate: false,
        };
      },
      () => {
        if (sendUpdate) {
          this.sendUpdate(name, type, value, timestamp);
        }
      }
    );
  }

  handleClearAllFilters() {
    this.inputFilterRef.current.clearFilter();
  }

  sendUpdate(name, type, value, timestamp) {
    const { glEventHub } = this.props;
    glEventHub.emit(InputFilterEvent.FILTERS_CHANGED, this, {
      name,
      type,
      value,
      timestamp,
    });
  }

  /**
   * Set the filter value, card side, selected column
   * @param {Object} state Filter state to set
   * @param {boolean} sendUpdate Emit filters changed event if true
   */
  setPanelState(state, sendUpdate = false) {
    // Set the skipUpdate flag so the next onChange handler call doesn't emit the FILTERS_CHANGED event
    this.setState({ skipUpdate: !sendUpdate });

    // Changing the inputFilter state via props doesn't quite work because of the delays on manual input changes
    // Setting the ref state directly triggers the onChange handler and updates the panelState
    this.inputFilterRef.current?.setFilterState(state);
  }

  updateColumns() {
    const { columns } = this.props;
    if (columns == null) {
      return;
    }

    this.setState(state => {
      const { column } = state;

      if (column == null && columns.length > 0) {
        return {
          columns: [...columns],
          column: columns[0],
        };
      }

      if (
        column != null &&
        !columns.find(
          ({ name, type }) => column.name === name && column.type === type
        )
      ) {
        return { columns: [...columns, column] };
      }

      return { columns: [...columns] };
    });
  }

  render() {
    const { glContainer, glEventHub } = this.props;
    const { column, columns, isValueShown, value } = this.state;
    return (
      <Panel
        className="iris-input-filter-panel"
        componentPanel={this}
        glContainer={glContainer}
        glEventHub={glEventHub}
        onClearAllFilters={this.handleClearAllFilters}
        isClonable
        isRenamable
      >
        <InputFilter
          ref={this.inputFilterRef}
          column={column}
          columns={columns}
          onChange={this.handleChange}
          isValueShown={isValueShown}
          value={value}
        />
      </Panel>
    );
  }
}

InputFilterPanel.propTypes = {
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  panelState: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    value: PropTypes.string,
    isValueShown: PropTypes.bool,
  }),
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
};

InputFilterPanel.defaultProps = {
  panelState: null,
};

// Have to explicitly specify displayName
// otherwise it gets minified and breaks LayoutUtils.getComponentName
InputFilterPanel.displayName = 'InputFilterPanel';

const mapStateToProps = (state, ownProps) => {
  const { localDashboardId } = ownProps;

  return {
    columns: getColumnsForDashboard(state, localDashboardId),
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  InputFilterPanel
);
