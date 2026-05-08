import React, { useCallback, useMemo } from 'react';
import { vsEdit } from '@deephaven/icons';
import ConditionalFormattingMenu from '../../sidebar/conditional-formatting/ConditionalFormattingMenu';
import ConditionalFormatEditor from '../../sidebar/conditional-formatting/ConditionalFormatEditor';
import type {
  TableOption,
  TableOptionPanelProps,
  GridStateSnapshot,
} from '../TableOption';
import type { SidebarFormattingRule } from '../../sidebar';

// ============================================================================
// Conditional Formatting Option Local State
// ============================================================================

interface ConditionalFormattingState {
  /** Index of the rule being edited (-1 for new rule, null if not editing) */
  editIndex: number | null;
  /** Preview of the rule being edited (for live updates) */
  preview: SidebarFormattingRule | null;
}

type ConditionalFormattingAction =
  | { type: 'START_CREATE' }
  | { type: 'START_EDIT'; index: number; rule: SidebarFormattingRule }
  | { type: 'UPDATE_PREVIEW'; preview: SidebarFormattingRule | null }
  | { type: 'CLEAR_EDIT' };

function conditionalFormattingReducer(
  state: ConditionalFormattingState,
  action: ConditionalFormattingAction
): ConditionalFormattingState {
  switch (action.type) {
    case 'START_CREATE':
      return { editIndex: -1, preview: null };
    case 'START_EDIT':
      // Clone the rule for preview
      return { editIndex: action.index, preview: { ...action.rule } };
    case 'UPDATE_PREVIEW':
      return { ...state, preview: action.preview };
    case 'CLEAR_EDIT':
      return { editIndex: null, preview: null };
    default:
      return state;
  }
}

// ============================================================================
// Conditional Formatting Menu Panel
// ============================================================================

function ConditionalFormattingPanel({
  gridState,
  dispatch,
  dispatchOption,
  openSubPanel,
}: TableOptionPanelProps<ConditionalFormattingState>): JSX.Element {
  const { conditionalFormats } = gridState;

  const handleChange = useCallback(
    (formats: readonly SidebarFormattingRule[]) => {
      dispatch({ type: 'SET_CONDITIONAL_FORMATS', formats });
    },
    [dispatch]
  );

  const handleCreate = useCallback(() => {
    dispatchOption({ type: 'START_CREATE' });
    openSubPanel(ConditionalFormattingEditOption);
  }, [dispatchOption, openSubPanel]);

  const handleSelect = useCallback(
    (index: number) => {
      dispatchOption({
        type: 'START_EDIT',
        index,
        rule: conditionalFormats[index],
      });
      openSubPanel(ConditionalFormattingEditOption);
    },
    [conditionalFormats, dispatchOption, openSubPanel]
  );

  return (
    <ConditionalFormattingMenu
      rules={conditionalFormats}
      onChange={handleChange}
      onCreate={handleCreate}
      onSelect={handleSelect}
    />
  );
}

// ============================================================================
// Conditional Formatting Edit Sub-Panel
// ============================================================================

function ConditionalFormattingEditPanel({
  gridState,
  dispatch,
  optionState,
  dispatchOption,
  closePanel,
}: TableOptionPanelProps<ConditionalFormattingState>): JSX.Element {
  const { model, conditionalFormats } = gridState;
  const { editIndex, preview } = optionState;

  // Get the rule being edited
  const rule = useMemo(() => {
    if (editIndex === -1) {
      // Creating new rule - return undefined to let editor create default
      return undefined;
    }
    if (editIndex != null && editIndex >= 0) {
      return preview ?? conditionalFormats[editIndex];
    }
    return undefined;
  }, [editIndex, preview, conditionalFormats]);

  const handleUpdate = useCallback(
    (updatedRule?: SidebarFormattingRule) => {
      dispatchOption({
        type: 'UPDATE_PREVIEW',
        preview: updatedRule ?? null,
      });
    },
    [dispatchOption]
  );

  const handleSave = useCallback(
    (savedRule: SidebarFormattingRule) => {
      if (editIndex === -1) {
        // Add new rule
        dispatch({
          type: 'SET_CONDITIONAL_FORMATS',
          formats: [...conditionalFormats, savedRule],
        });
      } else if (editIndex != null) {
        // Update existing rule
        const newFormats = [...conditionalFormats];
        newFormats[editIndex] = savedRule;
        dispatch({ type: 'SET_CONDITIONAL_FORMATS', formats: newFormats });
      }
      dispatchOption({ type: 'CLEAR_EDIT' });
      closePanel();
    },
    [editIndex, conditionalFormats, dispatch, dispatchOption, closePanel]
  );

  const handleCancel = useCallback(() => {
    dispatchOption({ type: 'CLEAR_EDIT' });
    closePanel();
  }, [dispatchOption, closePanel]);

  return (
    <ConditionalFormatEditor
      dh={model.dh}
      columns={model.columns}
      rule={rule}
      onUpdate={handleUpdate}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

// Sub-panel option definition (not registered in menu)
const ConditionalFormattingEditOption: TableOption<ConditionalFormattingState> =
  {
    type: 'conditional-formatting-edit',
    menuItem: {
      title: 'Edit Formatting Rule',
      // Not visible in menu - only opened via openSubPanel
      isVisible: () => false,
    },
    Panel: ConditionalFormattingEditPanel,
  };

// ============================================================================
// Main Option Export
// ============================================================================

/**
 * Conditional Formatting option configuration.
 * Shows when format columns are available on the model.
 */
export const ConditionalFormattingOption: TableOption<
  ConditionalFormattingState,
  ConditionalFormattingAction
> = {
  type: 'conditional-formatting',

  menuItem: {
    title: 'Conditional Formatting',
    icon: vsEdit,
    isAvailable: (gridState: GridStateSnapshot) =>
      gridState.model.isFormatColumnsAvailable,
    order: 20,
  },

  Panel: ConditionalFormattingPanel,

  initialState: {
    editIndex: null,
    preview: null,
  },

  reducer: conditionalFormattingReducer,
};

export default ConditionalFormattingOption;
