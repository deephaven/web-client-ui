import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import { GLPropTypes } from '@deephaven/dashboard';
import Panel from './Panel';
import InputFilter from '../controls/input-filter/InputFilter';
import { InputFilterEvent } from '../events';
import { getColumnsForDashboard } from '../redux';
import './InputFilterPanel.scss';

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
      ({ panelState, timestamp: prevTimestamp, wasFlipped }) => {
        // If the user had a value set, and they flip the card over and flip it back without changing any settings, ignore it
        const isFlip =
          panelState != null &&
          isValueShown !== panelState.isValueShown &&
          name === panelState.name &&
          type === panelState.type &&
          value === panelState.value;
        sendUpdate = isValueShown && (!isFlip || !wasFlipped);

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

const mapStateToProps = (state, ownProps) => {
  const { localDashboardId } = ownProps;

  return {
    columns: getColumnsForDashboard(state, localDashboardId),
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  InputFilterPanel
);
