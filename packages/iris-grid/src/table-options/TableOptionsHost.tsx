import React, { useCallback, useMemo, useReducer, useState } from 'react';
import { Menu, Stack, Page } from '@deephaven/components';
import type { GridStateSnapshot, GridDispatch } from './TableOption';
import { TableOptionsHostContext } from './TableOptionsHostContext';
import type {
  TableOptionsRegistry,
  AnyTableOption,
} from './TableOptionsRegistry';

interface OptionStackEntry {
  option: AnyTableOption;
  state: unknown;
}

interface TableOptionsHostProps {
  /** Registry containing available options */
  registry: TableOptionsRegistry;

  /** Current grid state snapshot */
  gridState: GridStateSnapshot;

  /** Dispatch function for grid actions */
  dispatch: GridDispatch;

  /** Callback when menu should close */
  onClose: () => void;

  /**
   * Legacy options stack for backward compatibility.
   * Used during migration from the old architecture.
   */
  legacyOptionsStack?: React.ReactNode[];

  /**
   * Legacy open options for backward compatibility.
   * Used during migration from the old architecture.
   */
  legacyOpenOptions?: readonly { type: string; title: string }[];

  /**
   * Legacy menu select handler for backward compatibility.
   */
  legacyOnMenuSelect?: (index: number) => void;

  /**
   * Legacy menu back handler for backward compatibility.
   */
  legacyOnMenuBack?: () => void;
}

/**
 * Reducer for option-local state.
 * Manages state for options that define their own reducer.
 */
interface OptionStateAction {
  type: 'INIT_OPTION' | 'DISPATCH_OPTION' | 'POP_OPTION';
  optionType?: string;
  action?: unknown;
  initialState?: unknown;
}

interface OptionStatesMap {
  [optionType: string]: unknown;
}

function optionStatesReducer(
  state: OptionStatesMap,
  action: OptionStateAction
): OptionStatesMap {
  switch (action.type) {
    case 'INIT_OPTION':
      if (action.optionType == null) return state;
      return { ...state, [action.optionType]: action.initialState };
    case 'DISPATCH_OPTION':
      // Option actions are handled by the option's own reducer
      // This is just a placeholder - actual dispatch happens in the component
      return state;
    case 'POP_OPTION': {
      if (action.optionType == null) return state;
      const newState = { ...state };
      delete newState[action.optionType];
      return newState;
    }
    default:
      return state;
  }
}

/**
 * Host component for Table Options.
 * Renders the options menu and manages panel navigation.
 *
 * This component:
 * - Gets available options from the registry
 * - Renders the menu
 * - Manages the navigation stack
 * - Provides context to panels
 * - Manages option-local state for options with reducers
 */
export function TableOptionsHost({
  registry,
  gridState,
  dispatch,
  onClose,
  legacyOptionsStack,
  legacyOpenOptions,
  legacyOnMenuSelect,
  legacyOnMenuBack,
}: TableOptionsHostProps): JSX.Element {
  // Stack of open options (for sub-panel navigation)
  const [optionStack, setOptionStack] = useState<OptionStackEntry[]>([]);

  // Option-local states (for options with reducers)
  const [optionStates, dispatchOptionStates] = useReducer(
    optionStatesReducer,
    {}
  );

  // Get menu items from registry
  const registryOptions = useMemo(
    () => registry.getOptions(gridState),
    [registry, gridState]
  );

  // Build menu items for display
  const menuItems = useMemo(
    () =>
      registryOptions.map(opt => {
        const baseItem = {
          type: opt.type,
          title: opt.menuItem.title,
          subtitle: opt.menuItem.subtitle,
          icon: opt.menuItem.icon,
        };

        // Handle toggle options
        if (opt.toggle != null) {
          const { toggle } = opt;
          return {
            ...baseItem,
            isOn: toggle.getValue(gridState),
            onChange: () => {
              dispatch({ type: toggle.actionType } as Parameters<
                typeof dispatch
              >[0]);
            },
          };
        }

        return baseItem;
      }),
    [registryOptions, gridState, dispatch]
  );

  // Handle menu item selection
  const handleMenuSelect = useCallback(
    (index: number) => {
      const option = registryOptions[index];
      if (option == null) {
        // Fall back to legacy handler if option not in registry
        legacyOnMenuSelect?.(index);
        return;
      }

      // If option has a panel, open it
      if (option.Panel != null) {
        // Initialize option state if it has a reducer
        if (option.initialState !== undefined) {
          dispatchOptionStates({
            type: 'INIT_OPTION',
            optionType: option.type,
            initialState: option.initialState,
          });
        }

        setOptionStack(prev => [
          ...prev,
          { option, state: option.initialState },
        ]);
      }

      // If option is a toggle, dispatch the toggle action
      if (option.toggle != null) {
        dispatch({ type: option.toggle.actionType } as Parameters<
          typeof dispatch
        >[0]);
      }
    },
    [registryOptions, legacyOnMenuSelect, dispatch]
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (optionStack.length > 0) {
      const poppedOption = optionStack[optionStack.length - 1];
      dispatchOptionStates({
        type: 'POP_OPTION',
        optionType: poppedOption.option.type,
      });
      setOptionStack(prev => prev.slice(0, -1));
    } else {
      legacyOnMenuBack?.();
    }
  }, [optionStack, legacyOnMenuBack]);

  // Open a sub-panel
  const openSubPanel = useCallback((option: AnyTableOption) => {
    if (option.initialState !== undefined) {
      dispatchOptionStates({
        type: 'INIT_OPTION',
        optionType: option.type,
        initialState: option.initialState,
      });
    }
    setOptionStack(prev => [...prev, { option, state: option.initialState }]);
  }, []);

  // Close current panel
  const closePanel = useCallback(() => {
    handleBack();
  }, [handleBack]);

  // Create dispatch function for option-local actions
  const createOptionDispatch = useCallback(
    (option: AnyTableOption) => (action: unknown) => {
      if (option.reducer == null) return;

      const { reducer } = option;
      setOptionStack(prev =>
        prev.map(entry =>
          entry.option.type === option.type
            ? {
                ...entry,
                // Using reducer from closure since we already checked it's not null
                state: reducer(entry.state as never, action as never),
              }
            : entry
        )
      );
    },
    []
  );

  // Context value for panels
  const contextValue = useMemo(
    () => ({
      gridState,
      dispatch,
      openSubPanel,
      closePanel,
      goBack: closePanel, // alias for closePanel
    }),
    [gridState, dispatch, openSubPanel, closePanel]
  );

  // Render panels from registry
  const registryPanels = optionStack.map(({ option, state }) => {
    if (option.Panel == null) return null;

    const { Panel } = option;
    const optionState = optionStates[option.type] ?? state;

    return (
      <Page
        key={option.type}
        title={option.menuItem.title}
        onBack={handleBack}
        onClose={onClose}
      >
        <Panel
          gridState={gridState}
          dispatch={dispatch}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          optionState={optionState as any}
          dispatchOption={createOptionDispatch(option)}
          openSubPanel={openSubPanel}
          closePanel={closePanel}
        />
      </Page>
    );
  });

  return (
    <TableOptionsHostContext.Provider value={contextValue}>
      <Stack>
        <Page title="Table Options" onClose={onClose}>
          <Menu onSelect={handleMenuSelect} items={menuItems} />
        </Page>
        {/* Registry-managed panels */}
        {registryPanels}
        {/* Legacy panels for backward compatibility during migration */}
        {legacyOptionsStack?.map((panel, i) => {
          const legacyOption = legacyOpenOptions?.[i];
          if (legacyOption == null) return null;
          return (
            <Page
              key={legacyOption.type}
              title={legacyOption.title}
              onBack={legacyOnMenuBack}
              onClose={onClose}
            >
              {panel}
            </Page>
          );
        })}
      </Stack>
    </TableOptionsHostContext.Provider>
  );
}

export default TableOptionsHost;
