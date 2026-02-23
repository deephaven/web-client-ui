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

2. **Pivot Builder** - Future work to make it a plugin using the new architecture. Focus on the extensible architecture for now.

3. **UI.Table support** - Future work.


---

## Technical Design

### Architecture Overview
  - Plugin chaining mechanism - middleware pattern
  - Registry-based architecture where options are self-contained modules
  - Plugins register options via `defaultTableOptionsRegistry.register(option)`
  - Options define their own menu item, Panel component, and toggle behavior

### Key Files Created
- `packages/iris-grid/src/table-options/TableOption.ts` - Core interfaces (GridStateSnapshot, GridAction, TableOption, etc.)
- `packages/iris-grid/src/table-options/TableOptionsRegistry.ts` - Registry class with register/unregister/modify/subscribe
- `packages/iris-grid/src/table-options/TableOptionsHostContext.ts` - Context with useTableOptionsHost() hook
- `packages/iris-grid/src/table-options/TableOptionsHost.tsx` - Host component with Stack/Page/Menu rendering
- `packages/iris-grid/src/table-options/TableOptionsWrapper.tsx` - Bridge between IrisGrid class component and TableOptionsHost
- `packages/iris-grid/src/table-options/registerBuiltinOptions.ts` - Registers all built-in options
- `packages/iris-grid/src/table-options/options/*.tsx` - Individual option implementations
- `packages/dashboard-core-plugins/src/GridMiddlewarePlugin.tsx` - Example middleware demonstrating registry usage


### Decisions

1. Custom option hydration/dehydration should be taken care of by the plugin itself via the `usePersistentState` hook

2. Host component state management - plugins update only what they need, not entire state

3. Provide a mechanism to enable/disable plugins, and define the order of execution for plugins

4. Widget plugin/panel plugin distinction - ensure the architecture supports both use cases

5. **Registry-based architecture**: Plugins register options via `defaultTableOptionsRegistry.register()` instead of using modifier props

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
  - Shows how to register custom Table Options via registry
  - Registered in `code-studio` and `embed-widget` for testing


### Phase 2: IrisGrid State Interface & Table Options Registry ✅
- [x] Define IrisGrid state access/update interface for built-in options
  - Created `TableOptionsHostContext.ts` with `TableOptionsHostContextValue` interface
  - Interface provides: gridState (read-only snapshot), dispatch (action handlers), navigation
  - Added `useTableOptionsHost()` hook for functional components
- [x] Convert built-in Table Options to use the interface for updates
  - All built-in options now use `useTableOptionsHost()` hook
  - Panels call `dispatch({ type: 'SET_*', payload })` to update grid state
- [x] Define the interface for built-in Table Options menu items
  - `TableOption` interface with `type`, `menuItem`, `Panel`, optional `toggle`, optional `order`
  - `TableOptionToggle` interface for toggle options with `getValue`, `actionType`, `shortcut`
  - `TableOptionPanelProps` interface with `gridState`, `dispatch`, `onBack`, navigation helpers
- [x] Write the configuration for the existing built-in options
  - Created self-contained option files for all 15 built-in options

#### Table Options Registry Architecture ✅

**Goal:** Fully decouple IrisGrid from Table Options by creating a registry-based architecture where options are self-contained modules.

**Architecture Overview:**
```
┌─────────────────────────────────────────────────────────────┐
│                     TableOptionsRegistry                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │SelectDistinct│ │  RollupRows  │ │ CustomColumn │  ...    │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         IrisGrid                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ TableOptionsHost                                        ││
│  │  - Renders menu from registry                           ││
│  │  - Manages navigation stack                             ││
│  │  - Provides GridState + GridDispatch via context        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Core Interfaces:**
- `TableOption<TOptionState>` - Self-contained option definition with menu item config, Panel component, optional toggle config
- `TableOptionPanelProps` - What panels receive: gridState (read-only), dispatch (actions), navigation
- `GridStateSnapshot` - Read-only view of grid state (model, columns, settings, toggle states)
- `GridAction / GridDispatch` - Actions to modify grid state (SET_*, TOGGLE_*, CREATE_CHART, etc.)

**Benefits:**
| Aspect | Before | After |
|--------|--------|-------|
| Adding new option | Modify IrisGrid switch, add handler methods | Register single self-contained file |
| Option-specific state | IrisGrid state | Local to option via reducer |
| Sub-panels | Hardcoded in IrisGrid | Generic via `openSubPanel` |
| Plugin integration | optionsModifier function | Registry register/unregister |
| Testing | Need full IrisGrid | Test option in isolation |
| Bundle size | All options bundled | Could lazy-load options |

**Migration Phases:**
- **Phase A:** Create registry, types, and `TableOptionsHost` component ✅
- **Phase B:** Migrate low-complexity options (SelectDistinct, CustomColumn, RollupRows) ✅
- **Phase C:** Migrate medium-complexity options (Aggregations, VisibilityOrdering) ✅
- **Phase D:** Migrate high-complexity options (TableExporter, ConditionalFormatting) ✅
- **Phase E:** Remove legacy switch statement ✅

**Files Created:**
- `packages/iris-grid/src/table-options/TableOption.ts` - Core interfaces ✅
- `packages/iris-grid/src/table-options/TableOptionsRegistry.ts` - Registry class ✅
- `packages/iris-grid/src/table-options/TableOptionsHostContext.ts` - Context + hook ✅
- `packages/iris-grid/src/table-options/TableOptionsHost.tsx` - Host component ✅
- `packages/iris-grid/src/table-options/TableOptionsWrapper.tsx` - Bridge component ✅
- `packages/iris-grid/src/table-options/registerBuiltinOptions.ts` - Built-in registration ✅
- `packages/iris-grid/src/table-options/options/SelectDistinctOption.tsx` ✅
- `packages/iris-grid/src/table-options/options/CustomColumnOption.tsx` ✅
- `packages/iris-grid/src/table-options/options/RollupRowsOption.tsx` ✅
- `packages/iris-grid/src/table-options/options/VisibilityOrderingOption.tsx` ✅
- `packages/iris-grid/src/table-options/options/AggregationsOption.tsx` ✅
- `packages/iris-grid/src/table-options/options/TableExporterOption.tsx` ✅
- `packages/iris-grid/src/table-options/options/ConditionalFormattingOption.tsx` ✅
- `packages/iris-grid/src/table-options/options/QuickFiltersOption.ts` ✅
- `packages/iris-grid/src/table-options/options/SearchBarOption.ts` ✅
- `packages/iris-grid/src/table-options/options/GotoRowOption.ts` ✅
- `packages/iris-grid/src/table-options/options/AdvancedSettingsOption.tsx` ✅
- `packages/iris-grid/src/table-options/options/ChartBuilderOption.tsx` ✅
- `packages/iris-grid/src/table-options/options/index.ts` ✅
- `packages/iris-grid/src/table-options/index.ts` ✅

**Legacy Code Removed from IrisGrid.tsx:**
- Removed `useRegistryOptions` prop (registry is now always used) ✅
- Removed `additionalMenuOptions` prop (plugins use registry instead) ✅
- Removed `optionsModifier` prop (plugins use registry instead) ✅
- Removed `getCachedOptionItems` method (~100 lines) ✅
- Removed `getTableOptionsHostContextValue` method ✅
- Removed legacy switch statement (~140 lines) ✅
- Removed dead code variables ✅
- Removed 11 unused icon imports ✅
- Removed unused type import `OptionItemsModifier` ✅

**GridMiddlewarePlugin Updates:**
- Updated to use `defaultTableOptionsRegistry.register()` ✅
- Demonstrates proper plugin pattern for adding custom Table Options ✅


### Phase 3: Examples, Documentation & Polish 🔄
- [ ] Clean up the example plugin (GridMiddlewarePlugin), add tests
- [ ] Add persistence example using `usePersistentState`
- [ ] Add another plugin to demonstrate chaining with configurable order of execution
- [ ] Write documentation for the new extensible Table Options menu architecture
- [ ] Add unit tests for new table-options components


### Phase 4: Integration Testing & Verification 🔲
- [ ] Test in code-studio with sample database
- [ ] Verify Quick Filters toggle works
- [ ] Verify Search Bar toggle works  
- [ ] Verify Go To Row toggle works
- [ ] Verify Chart Builder opens correctly
- [ ] Verify Advanced Settings opens correctly
- [ ] Verify all sidebar options (SelectDistinct, CustomColumn, etc.) work
- [ ] Verify table download CSV works
- [ ] Verify GridMiddlewarePlugin custom option appears and works
- [ ] Test enterprise with custom plugins

---

## Delivery Plan

### Deliverables

| Phase | Deliverables | Status |
|-------|--------------|--------|
| 1 | Middleware plugin infrastructure, chaining, tests, example plugin | ✅ Complete |
| 2 | Registry architecture, built-in options refactor, legacy removal | ✅ Complete |
| 3 | Documentation, additional examples, tests | 🔄 In Progress |
| 4 | Integration testing and verification | 🔲 Not started |

### Testing Strategy

- **Unit Tests**:
    - Helper functions
    - Registry operations
    - Individual option components (TBD)

- **Integration and E2E Tests**:
    - Custom options render and work with IrisGrid
    - Multiple plugins modifying the same host component
    - Persistence of changes made via custom options

### Success Criteria

- [x] Plugins can register custom options without code changes
- [x] Custom options appear in menu and render correctly
- [x] Custom options can modify IrisGrid state (via `useTableOptionsHost()` hook)
- [x] Approach is generic and reusable (registry pattern implemented)
- [ ] All existing built-in options work unchanged (needs verification)
- [ ] XX% test coverage
- [x] Minimal breaking changes (removed deprecated props)
- [ ] Documentation complete with examples

---

## API Changes

### Breaking Changes
The following props have been removed from `IrisGrid` and `IrisGridPanel`:
- `additionalMenuOptions` - Use `defaultTableOptionsRegistry.register()` instead
- `optionsModifier` - Use registry `modify()` or custom option registration instead
- `useRegistryOptions` - Registry is now always used

### Migration Guide
**Before (deprecated):**
```tsx
<IrisGridPanel
  additionalMenuOptions={[customOption]}
  optionsModifier={opts => [...opts, myOption]}
/>
```

**After:**
```tsx
import { defaultTableOptionsRegistry } from '@deephaven/iris-grid';

// In plugin initialization
defaultTableOptionsRegistry.register(MyCustomOption);
```

### New Public Exports from `@deephaven/iris-grid`
- `TableOption` - Interface for custom options
- `TableOptionPanelProps` - Props interface for Panel components
- `GridStateSnapshot` - Read-only grid state interface
- `GridAction` / `GridDispatch` - Action types and dispatcher
- `useTableOptionsHost` - Hook for accessing grid state in panels
- `defaultTableOptionsRegistry` - Registry singleton for option registration
- `TableOptionsRegistry` - Registry class (for creating custom registries)
