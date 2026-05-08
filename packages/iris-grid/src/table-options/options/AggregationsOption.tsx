import React, { useCallback, useMemo } from 'react';
import { vsSymbolOperator } from '@deephaven/icons';
import { isEditableGridModel } from '@deephaven/grid';
import {
  Aggregations,
  AggregationEdit,
  type Aggregation,
  type AggregationSettings,
} from '../../sidebar';
import type {
  TableOption,
  TableOptionPanelProps,
  GridStateSnapshot,
} from '../TableOption';
import type AggregationOperation from '../../sidebar/aggregations/AggregationOperation';

// ============================================================================
// Aggregation Option Local State
// ============================================================================

interface AggregationsOptionState {
  /** The aggregation currently being edited (for sub-panel) */
  selectedAggregation: Aggregation | null;
}

type AggregationsOptionAction =
  | { type: 'SELECT_AGGREGATION'; aggregation: Aggregation }
  | { type: 'CLEAR_SELECTION' };

function aggregationsReducer(
  state: AggregationsOptionState,
  action: AggregationsOptionAction
): AggregationsOptionState {
  switch (action.type) {
    case 'SELECT_AGGREGATION':
      return { ...state, selectedAggregation: action.aggregation };
    case 'CLEAR_SELECTION':
      return { ...state, selectedAggregation: null };
    default:
      return state;
  }
}

// ============================================================================
// Aggregations Panel
// ============================================================================

function AggregationsPanel({
  gridState,
  dispatch,
  optionState,
  dispatchOption,
  openSubPanel,
}: TableOptionPanelProps<AggregationsOptionState>): JSX.Element {
  const { model, aggregationSettings, isRollup } = gridState;

  const availablePlacements = useMemo(() => {
    if (isEditableGridModel(model) && model.isEditable) {
      return ['top'] as const;
    }
    return ['top', 'bottom'] as const;
  }, [model]);

  const handleChange = useCallback(
    (
      settings: AggregationSettings,
      _added: AggregationOperation[],
      _removed: AggregationOperation[]
    ) => {
      dispatch({ type: 'SET_AGGREGATION_SETTINGS', settings });
    },
    [dispatch]
  );

  const handleEdit = useCallback(
    (aggregation: Aggregation) => {
      dispatchOption({ type: 'SELECT_AGGREGATION', aggregation });
      openSubPanel(AggregationEditOption);
    },
    [dispatchOption, openSubPanel]
  );

  return (
    <Aggregations
      settings={aggregationSettings}
      isRollup={isRollup}
      availablePlacements={[...availablePlacements]}
      onChange={handleChange}
      onEdit={handleEdit}
      dh={model.dh}
    />
  );
}

// ============================================================================
// Aggregation Edit Sub-Panel
// ============================================================================

/**
 * Sub-panel for editing a single aggregation's column selection.
 * This option is not registered in the menu - it's opened via openSubPanel.
 */
function AggregationEditPanel({
  gridState,
  dispatch,
  optionState,
  closePanel,
}: TableOptionPanelProps<AggregationsOptionState>): JSX.Element {
  const { model, aggregationSettings } = gridState;
  const { selectedAggregation } = optionState;

  const handleChange = useCallback(
    (aggregation: Aggregation) => {
      // Update the aggregation in settings
      const newAggregations = aggregationSettings.aggregations.map(agg =>
        agg.operation === aggregation.operation ? aggregation : agg
      );
      dispatch({
        type: 'SET_AGGREGATION_SETTINGS',
        settings: { ...aggregationSettings, aggregations: newAggregations },
      });
    },
    [dispatch, aggregationSettings]
  );

  if (selectedAggregation == null) {
    // If no aggregation selected, close the panel
    closePanel();
    return <div>No aggregation selected</div>;
  }

  return (
    <AggregationEdit
      aggregation={selectedAggregation}
      columns={model.originalColumns}
      onChange={handleChange}
    />
  );
}

// Sub-panel option definition (not registered in menu)
// Uses the same state type as parent to share selectedAggregation
const AggregationEditOption: TableOption<
  AggregationsOptionState,
  AggregationsOptionAction
> = {
  type: 'aggregation-edit',
  menuItem: {
    title: 'Edit Aggregation',
    // No visibility - this is a sub-panel only
    isVisible: () => false,
  },
  Panel: AggregationEditPanel,
};

// ============================================================================
// Main Option Export
// ============================================================================

/**
 * Aggregations option configuration.
 * Shows when totals are available on the model.
 */
export const AggregationsOption: TableOption<
  AggregationsOptionState,
  AggregationsOptionAction
> = {
  type: 'aggregations',

  menuItem: {
    title: 'Aggregate Columns',
    icon: vsSymbolOperator,
    isAvailable: (gridState: GridStateSnapshot) =>
      gridState.model.isTotalsAvailable,
    order: 30,
  },

  Panel: AggregationsPanel,

  initialState: {
    selectedAggregation: null,
  },

  reducer: aggregationsReducer,
};

export default AggregationsOption;
