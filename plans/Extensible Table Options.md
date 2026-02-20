# Extensible Table Options Menu for IrisGrid

**Jira Ticket**: DH-xxxxx (To be filled)

Enable plugins to register custom Table Options menu items without requiring modifications to the web-client-ui code.

---

## Team(s)

### Primary Team
- **UI Team** (web-client-ui, deephaven-plugins)

### Cross-Team Dependencies
- None

---

## Problem / Feature Gap

### Current Limitation
The Table Options menu is hard-coded in the `IrisGrid` component with a fixed set of built-in options. To add a custom option, developers must:
1. Modify iris-grid package in the web-client-ui repository
2. Add new `OptionType` enum values
3. Update multiple switch statements
4. Publish a new version of the updated package

This prevents plugins from providing their own table transformation options.

### Desired State

At a minimum, we want to enable plugins to register custom Table Options menu items for `IrisGrid` at runtime without modifying the `IrisGrid` code. Same custom menu configuration should be usable with `ui.table` component.  

Table Options menu consists of the menu screen (potentially nested), and an optional configuration UI rendered when an item is selected. See if we can use Adobe Spectrum menu components for the menu screen.

Ideally, we want a generic architecture that can be reused in other container components in the future, such as a Sliding Sidebar.

Plugins should be able to
  - Register custom menu items at runtime without any code changes on the web-client-ui side. A custom Table Options menu item should:
      - Appear at the specified position in the Table Options menu alongside built-in options
      - When selected, render a custom UI for configuration, or run an action directly, e.g. toggle a setting in the context of the host component
      - Allow custom renderer for the menu item itself to support menu items with UI Switches or other controls similar to the built-in Quick Filters option
  - Control the visibility of existing menu options. This may be achievable via a custom table model that hides certain options, so this is lower priority.
  - Access and modify the state of the host component via a defined interface
  - Provide custom hydration/dehydration logic if needed
  
Changes made via the custom Table Options items should be persistent. `IrisGrid` should be able to apply the required changes on load.


---

## Scope

### In Scope / Requirements

   - Define the interface for custom menu items, including custom renderers, behaviors, state update mechanism

   - Define the interface for `IrisGrid` state access and modification by plugins

   - Convert the existing built-in Table Options menu to use the new extensible architecture

   - The plugins should implement the Middleware pattern. Currently, we only allow one plugin per widget type and ignore any subsequent plugins of the same type. Update the WidgetLoaderPlugin to check if the subsequent plugins define the middleware interface and chain them together if so. The order of execution should be defined by the plugin registration order.

   - Pass the built-in options to the plugins so they can extend/modify/hide them if needed; return the original list by default

   - Make sure we expose ordering/priority of menu items to plugins to control where the items appear in the menu

   - Provide example plugin(s) demonstrating how to register custom Table Options menu items (if this is implemented separately from the Pivot Builder plugin)

   - For the Pivot Builder - make the pivot configuration persistent. See if we can store the order of operations as part of the table state. This should probably be on the plugin side. TBD: behavior execution order when multiple plugins modify the same host component state.

   - Test the fallback mechanism when the plugin (or one of the plugin chain) is not present
   
   - Minimize breaking changes in the `IrisGrid` API


### Risks

### Out of Scope / Limitations
1. **Convert Table Options** to use Spectrum menu components - Future work.

2. **Pivot Builder** - Future work to make it a plugin using the new architecture.Focus on the extensible architecture for now.

3. **UI.Table support** - Future work.


---

## Technical Design

### Architecture Overview
  - Plugin chaining mechanism - middleware pattern
  - Custom options use `render` prop on `OptionItem` to provide configuration panels
  - Custom option types use string values to avoid enum conflicts

### Key Files Changed
- `packages/iris-grid/src/CommonTypes.tsx` - Extended `OptionItem` type with `render` prop, added `OptionItemsModifier` type
- `packages/iris-grid/src/IrisGrid.tsx` - Added `optionsModifier` prop, `TableOptionsContext.Provider`, `getTableOptionsContextValue` method
- `packages/iris-grid/src/TableOptionsContext.tsx` - New context for Table Options panels with state access and update methods
- `packages/iris-grid/src/index.ts` - Exports for `TableOptionsContext`, `useTableOptions`, `OptionItemsModifier`
- `packages/dashboard-core-plugins/src/GridMiddlewarePlugin.tsx` - Example middleware demonstrating `useTableOptions` hook usage
- `packages/dashboard-core-plugins/src/panels/IrisGridPanel.tsx` - Added `optionsModifier` prop passthrough

TBD:
  - Refactor built-in options to use `useTableOptions` instead of direct props


### Decisions

1. Custom option hydration/dehydration should be taken care of by the plugin itself via the `usePersistentState` hook

2. Host component state management - plugins update only what they need, not entire state

3. Provide a mechanism to enable/disable plugins, and define the order of execution for plugins

4. Widget plugin/panel plugin distinction - ensure the architecture supports both use cases

---

## Development Plan

### Phase 1: Middleware Plugin Infrastructure ✅
- [x] Investigate if plugin chains are possible on the same widget type
  - Yes, we can chain plugins implementing a middleware interface. The order of execution is determined by the registration order.
- [x] Investigate Widget vs Panel plugins, support for core plugins in Enterprise
  - Enterprise supports widget plugins via WidgetPluginLoader in GrizzlyPlus. Grizzly does not have a similar mechanism for panel plugins, support for panel plugins is out of scope for now.
- [x] Research Adobe Spectrum menu components
  - Skipping conversion for now.
- [x] Implement middleware interface in WidgetPlugin type (`packages/plugin/src/PluginTypes.ts`)
  - Added `WidgetMiddlewarePlugin` interface with `isMiddleware: true` marker
  - Added `WidgetMiddlewareComponentProps` and `WidgetMiddlewarePanelProps` for middleware components
  - Added `isWidgetMiddlewarePlugin()` type guard
- [x] Implement plugin chain support in WidgetLoaderPlugin (`packages/dashboard-core-plugins/src/WidgetLoaderPlugin.tsx`)
  - Updated `supportedTypes` logic to collect middleware plugins instead of replacing
  - Added `createChainedComponent()` and `createChainedPanelComponent()` helper functions
  - Middleware is chained in registration order (first registered = outermost wrapper)
  - Middleware registered before or after base plugin is correctly applied
  - Middleware-only registrations (no base plugin) are gracefully ignored
- [x] Add unit tests for middleware chaining
  - Added 4 type guard tests in `PluginTypes.test.ts`
  - Added 5 middleware chaining tests in `WidgetLoaderPlugin.test.tsx`
- [x] Create example middleware plugin (`packages/dashboard-core-plugins/src/GridMiddlewarePlugin.tsx`)
  - Demonstrates component and panel middleware for Table/TreeTable/HierarchicalTable/PartitionedTable
  - Shows how to inject `additionalMenuOptions` prop into wrapped panel
  - Registered in `code-studio` and `embed-widget` for testing


### Phase 2: IrisGrid State Interface & Menu Options 🔄
- [x] Define IrisGrid state access/update interface for built-in options
  - Created `TableOptionsContext.tsx` with `TableOptionsContextValue` interface
  - Interface provides: model, state values (customColumns, selectDistinctColumns, aggregationSettings, etc.)
  - Interface provides: update methods (setCustomColumns, setSelectDistinctColumns, setAggregationSettings, etc.)
  - Added `useTableOptions()` hook for functional components
  - IrisGrid provides the context via `TableOptionsContext.Provider` wrapping the table-sidebar
- [x] Convert built-in Table Options to use the interface for updates
  - Updated `GridMiddlewarePlugin` to demonstrate using `useTableOptions()` hook
  - Config panel now accesses model, selectDistinctColumns, customColumns via context
  - Config panel demonstrates calling `setSelectDistinctColumns()` and `closeCurrentOption()`
- [x] Define the interface for built-in Table Options menu items (`OptionItem` enhancements)
  - Extended `OptionItem.type` to accept `OptionType | string` for custom option types
  - Added optional `render?: () => React.ReactNode` property for custom configuration panels
  - Updated `IrisGrid.tsx` default case to call `option.render()` when present
- [ ] Write the configuration for the existing built-in options and behaviors to replace the current implementation with switch statements

#### Table Options Registry Architecture

**Goal:** Fully decouple IrisGrid from Table Options by creating a registry-based architecture where options are self-contained modules.

**Problems with Current Approach:**
- IrisGrid has a 150+ line switch statement tightly coupled to all 11 option implementations
- TableOptionsContext would need 30+ values to support all options
- Sub-panel logic (AGGREGATION_EDIT, etc.) is hardcoded in IrisGrid
- Option-specific state (download progress, format preview) is managed by IrisGrid but only used by one option

**Architecture Overview:**
```
┌─────────────────────────────────────────────────────────────┐
│                     TableOptionsRegistry                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │SelectDistinct│ │  RollupRows  │ │ CustomColumn │  ...    │
│  │    Option    │ │    Option    │ │    Option    │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         IrisGrid                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ TableOptionsHost                                     │    │
│  │  - Renders menu from registry                        │    │
│  │  - Manages navigation stack                          │    │
│  │  - Provides GridState + GridDispatch via context     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Core Interfaces:**
- `TableOption<TOptionState>` - Self-contained option definition with menu item config, Panel component, optional local state reducer
- `TableOptionPanelProps` - What panels receive: gridState (read-only), dispatch (actions), navigation
- `GridStateSnapshot` - Read-only view of grid state (model, columns, settings)
- `GridAction / GridDispatch` - Actions to modify grid state

**Benefits:**
| Aspect | Current | New Architecture |
|--------|---------|------------------|
| Adding new option | Modify IrisGrid switch, add handler methods | Register single self-contained file |
| Option-specific state | IrisGrid state | Local to option via reducer |
| Sub-panels | Hardcoded in IrisGrid | Generic via `openSubPanel` |
| Plugin override | optionsModifier function | Registry modify/unregister |
| Testing | Need full IrisGrid | Test option in isolation |
| Bundle size | All options bundled | Could lazy-load options |

**Migration Phases:**
- **Phase A:** Create registry, types, and `TableOptionsHost` component ✅
- **Phase B:** Migrate low-complexity options (SelectDistinct, CustomColumn, RollupRows) ✅
- **Phase C:** Migrate medium-complexity options (Aggregations, VisibilityOrdering)
- **Phase D:** Migrate high-complexity options (TableExporter, ConditionalFormatting)
- **Phase E:** Remove legacy switch statement

**Files Created:**
- `packages/iris-grid/src/table-options/TableOption.ts` - Core interfaces (GridStateSnapshot, GridAction, TableOption, etc.) ✅
- `packages/iris-grid/src/table-options/TableOptionsRegistry.ts` - Registry class with register/unregister/modify/subscribe ✅
- `packages/iris-grid/src/table-options/TableOptionsHostContext.ts` - Context with useTableOptionsHost() hook ✅
- `packages/iris-grid/src/table-options/TableOptionsHost.tsx` - Host component with Stack/Page/Menu rendering ✅
- `packages/iris-grid/src/table-options/options/SelectDistinctOption.tsx` - SelectDistinct option ✅
- `packages/iris-grid/src/table-options/options/CustomColumnOption.tsx` - CustomColumn option ✅
- `packages/iris-grid/src/table-options/options/RollupRowsOption.tsx` - RollupRows option ✅
- `packages/iris-grid/src/table-options/options/index.ts` - Options index ✅
- `packages/iris-grid/src/table-options/index.ts` - Public exports ✅

- [x] Add a prop in IrisGrid/IrisGridPanel to accept Table Options modifier function from the plugin system
  - Added `OptionItemsModifier` type: `(options: readonly OptionItem[]) => readonly OptionItem[]`
  - Added `optionsModifier?: OptionItemsModifier` prop to `IrisGrid` and `IrisGridPanel`
  - Exports `OptionItemsModifier` from `CommonTypes.tsx` and package index
- [x] Pass the built-in menu to the modifier function if defined, and render the result
  - In `IrisGrid.tsx`, applies modifier after merging options: `optionsModifier?.(mergedOptions) ?? mergedOptions`
  - Allows plugins to reorder, hide, or add custom options to the menu
- [x] Test show/hide/re-order/add functionality for menu options with a sample plugin
  - Updated `GridMiddlewarePlugin.tsx` with `MiddlewareConfigPanel` component
  - Demonstrates SelectDistinct-like configuration panel with a sample button
  - Uses custom option type `MIDDLEWARE_CUSTOM_OPTION` instead of reusing built-in enum
  - Panel renders when option is selected and logs to console on button click
  - Uses `optionsModifier` to move custom option to top of menu, demonstrating reordering capability


### Phase 3: Examples, Documentation & Polish
- [ ] Clean up the example plugin (GridMiddlewarePlugin), add tests
- [ ] Add examples based on different Spectrum menu components (optional)
- [ ] Add persistence example using `usePersistentState`
- [ ] Add another plugin to demonstrate chaining with configurable order of execution
- [ ] Write documentation for the new extensible Table Options menu architecture
- [ ] Convert the menu items to Spectrum components (optional, future work)

---

## Delivery Plan

### Deliverables

| Phase | Deliverables | Status |
|-------|--------------|--------|
| 1 | Middleware plugin infrastructure, chaining, tests, example plugin | ✅ Complete |
| 2 | IrisGrid state interface, menu options modifier, built-in options refactor | � In Progress |
| 3 | Documentation, additional examples, polish | 🔲 Not started |

### Testing Strategy

- **Unit Tests**:
    - Helper functions

- **Integration and E2E Tests**:
    - Custom options render and work with IrisGrid
    - Multiple plugins modifying the same host component
    - Persistence of changes made via custom options

### Success Criteria

- [x] Plugins can register custom options without code changes
- [x] Custom options appear in menu and render correctly
- [x] Custom options can modify IrisGrid state (via `useTableOptions()` hook)
- [x] Approach is generic and reusable (middleware pattern implemented)
- [ ] All existing built-in options work unchanged (needs verification)
- [ ] XX% test coverage
- [x] Minimal breaking changes (Phase 1 introduces additive interfaces only)
- [ ] Documentation complete with examples