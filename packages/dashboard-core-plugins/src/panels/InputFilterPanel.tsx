import React, { Component, type RefObject } from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import type { Container, EventEmitter } from '@deephaven/golden-layout';
import { type RootState } from '@deephaven/redux';
import { LayoutUtils } from '@deephaven/dashboard';
import { assertNotNull } from '@deephaven/utils';
import Panel from './CorePanel';
import InputFilter, {
  type InputFilterColumn,
} from '../controls/input-filter/InputFilter';
import { getColumnsForDashboard } from '../redux';
import { emitFilterChanged } from '../FilterEvents';

const INPUT_FILTER_DEBOUNCE = 250;

export interface PanelState {
  name?: string;
  type?: string;
  value?: string;
  isValueShown?: boolean;
  timestamp?: number;
}

interface InputFilterPanelProps {
  glContainer: Container;
  glEventHub: EventEmitter;
  panelState: PanelState;
  columns: InputFilterColumn[];
}

interface InputFilterPanelState {
  columns: InputFilterColumn[];
  column?: InputFilterColumn;
  value?: string;
  timestamp: number;
  isValueShown: boolean;
  wasFlipped: boolean;
  skipUpdate: boolean;
  // eslint-disable-next-line react/no-unused-state
  panelState: PanelState; // Dehydrated panel state that can load this panel}
}
class InputFilterPanel extends Component<
  InputFilterPanelProps,
  InputFilterPanelState
> {
  static defaultProps = {
    panelState: null,
  };

  static COMPONENT = 'InputFilterPanel';

  // Have to explicitly specify displayName
  // otherwise it gets minified and breaks LayoutUtils.getComponentName
  static displayName = 'InputFilterPanel';

  constructor(props: InputFilterPanelProps) {
    super(props);

    this.handleChange = debounce(
      this.handleChange.bind(this),
      INPUT_FILTER_DEBOUNCE
    );
    this.handleClearAllFilters = this.handleClearAllFilters.bind(this);

    this.inputFilterRef = React.createRef();

    const { panelState } = props;
    // if panelstate is null, use destructured defaults
    const {
      value,
      isValueShown = false,
      name,
      type,
      timestamp = Date.now(),
    } = panelState ?? {};

    this.state = {
      columns: [],
      column: name != null && type != null ? { name, type } : undefined,
      value,
      timestamp,
      isValueShown,
      wasFlipped: false,
      skipUpdate: false,
      // eslint-disable-next-line react/no-unused-state
      panelState, // Dehydrated panel state that can load this panel
    };
  }

  componentDidMount(): void {
    this.updateColumns();

    const { column, value, timestamp } = this.state;
    if (column != null) {
      const { name, type } = column;
      this.sendUpdate(name, type, value, timestamp);
    }
  }

  componentDidUpdate(prevProps: InputFilterPanelProps): void {
    const { columns } = this.props;
    if (columns !== prevProps.columns) {
      this.updateColumns();
    }
  }

  inputFilterRef: RefObject<InputFilter>;

  handleChange({
    column,
    isValueShown = false,
    value,
  }: {
    column?: InputFilterColumn;
    isValueShown?: boolean;
    value?: string;
  }): void {
    let name: string | undefined;
    let type: string | undefined;
    if (column != null) {
      ({ name, type } = column);
    }
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
        sendUpdate =
          (!skipUpdate && isValueShown && (!isFlip || !wasFlipped)) ?? false;

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

  handleClearAllFilters(): void {
    this.inputFilterRef.current?.clearFilter();
  }

  sendUpdate(
    name?: string,
    type?: string,
    value?: string,
    timestamp?: number
  ): void {
    const { glEventHub } = this.props;
    const panelId = LayoutUtils.getIdFromPanel(this);
    assertNotNull(panelId);
    emitFilterChanged(
      glEventHub,
      panelId,
      name != null && type != null && value != null && timestamp != null
        ? {
            name,
            type,
            value,
            timestamp,
          }
        : null
    );
  }

  /**
   * Set the filter value, card side, selected column
   * @param state Filter state to set
   * @param sendUpdate Emit filters changed event if true
   */
  setPanelState(state: PanelState, sendUpdate = false): void {
    // Set the skipUpdate flag so the next onChange handler call doesn't emit the FILTERS_CHANGED event
    this.setState({ skipUpdate: !sendUpdate });

    // Changing the inputFilter state via props doesn't quite work because of the delays on manual input changes
    // Setting the ref state directly triggers the onChange handler and updates the panelState
    this.inputFilterRef.current?.setFilterState(state);
  }

  updateColumns(): void {
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

  render(): JSX.Element {
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

const mapStateToProps = (
  state: RootState,
  ownProps: { localDashboardId: string }
): Pick<InputFilterPanelProps, 'columns'> => {
  const { localDashboardId } = ownProps;

  return {
    columns: getColumnsForDashboard(state, localDashboardId),
  };
};

const ConnectedInputFilterPanel = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(InputFilterPanel);

export default ConnectedInputFilterPanel;
