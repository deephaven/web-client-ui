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

At a minimum, we want to enable plugins to register custom Table Options menu items for `IrisGrid` at runtime without modifying the `IrisGrid` code. Same custom menu configuration should be usable with `UI.Table` component.

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

   - TBD: Could the plugins wrap the `IrisGrid` component and pass options via props? See if multiple plugins can handle the same widget type and create a chain of modification of the options list.

   - Pass the built-in options to the plugins so they can extend/modify/hide them if needed; return the original list by default

   - Make sure we expose ordering/priority of menu items to plugins to control where the items appear in the menu

   - Provide example plugin(s) demonstrating how to register custom Table Options menu items (if this is implemented separately from the Pivot Builder plugin)

   - For the Pivot Builder - make the pivot configuration persistent. See if we can store the order of operations as part of the table state. This should probably be on the plugin side. TBD: behavior execution order when multiple plugins modify the same host component state.

   - Test the fallback mechanism when the plugin (or one of the plugin chain) is not present
   
   - Minimize breaking changes in the `IrisGrid` API


### Risks

### Out of Scope / Limitations
1. **Pivot Builder** - Future work to make it a plugin using the new architecture.Focus on the extensible architecture for now.

2. **UI.Table support** - Future work.


---

## Technical Design

### Architecture Overview
TBD:
  - Plugin chaining mechanism
  - State access/update interface
  - `OptionItem` interface - menu item renderer, configuration UI, behavior
  - `OptionsMenuModifier` function signature
  - `IrisGridState` interface for state access/update


### Decisions

1. Custom option hydration/dehydration should be taken care of by the plugin itself via the `usePersistentState` hook

2. Host component state management - plugins update only what they need, not entire state

3. Provide a mechanism to enable/disable plugins, and define the order of execution for plugins

4. Widget plugin/panel plugin distinction - ensure the architecture supports both use cases

---

## Development Plan

### Phase 1: 
- Investigate if plugin chains are possible on the same widget type (2-3 hours)
- Investigate Widget vs Panel plugins, support for core plugins in Enterprise (1 day)
- Research Adobe Spectrum menu components (1-2 hours)


### Phase 2:
- If chains are not possible, update the plugin registration mechanism. Introduce plugin priority/order of execution (2-3 days)
- Implement a plugin wrapping the core GridPanel or GridWidget (1 day)
- Define IrisGrid state access/update interface for built-in options (1-2 days)
- Convert built-in Table Options to use the interface for updates (4-6 hours)
- Define the interface for built-in Table Options menu items (2-3 hours)
- Write the configuration for the existing built-in options and behaviors to replace the current implementation with switch statements (2-3 days)


### Phase 3:
- Convert the menu items to Spectrum components (4-6 hours)
- Add a prop in IrisGrid/IrisGridPanel to accept Table Options modifier function from the plugin system. Pass the built-in menu to the modifier function if defined, and render the result (4 hours)
- Test show/hide/re-order/add functionality for menu options with a sample plugin (1 day)

### Phase 3:
- Clean up the example plugin, add tests (2-3 days)
- Add examples based on different Spectrum menu components (1 day)
- Add persistence example (1 day)
- Add another plugin to demonstrate chaining with configurable order of execution (1 days)
- Write documentation for the new extensible Table Options menu architecture (4-6 hours)

---

## Delivery Plan

### Deliverables

| Phase | Deliverables | Timeline |
|-------|--------------|----------|
| 1 | Updated IrisGrid package. Tests. | Week 1-2 |
| 2 | Documentation, example plugins. | Week 2 |

### Testing Strategy

- **Unit Tests**:
    - Helper functions

- **Integration and E2E Tests**:
    - Custom options render and work with IrisGrid
    - Multiple plugins modifying the same host component
    - Persistence of changes made via custom options

### Success Criteria

- [ ] Plugins can register custom options without code changes
- [ ] Custom options appear in menu and render correctly
- [ ] Custom options can modify IrisGrid state
- [ ] Approach is generic and reusable
- [ ] All existing built-in options work unchanged
- [ ] XX% test coverage
- [ ] Minimal breaking changes
- [ ] Documentation complete with examples