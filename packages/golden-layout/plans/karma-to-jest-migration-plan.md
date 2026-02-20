# Golden-Layout: Karma to Jest Migration Plan

## STATUS: MIGRATION COMPLETE ✓

All 21 test files have been successfully migrated from Karma/Jasmine to Jest/TypeScript.

**Final Results:**

- 21 test suites (all passing)
- 91 total tests (89 passing, 2 skipped)
- Skipped tests: popout serialization tests (require real browser window)
- Karma files removed, devDependencies cleaned up

---

## Post-Migration Improvements

### 1. Enabled Drag Tests with jQuery Mocks

The drag tests were originally skipped because jsdom doesn't support jQuery dimension methods. Added mocks in `drag.test.ts` and `deferred-create-drag.test.ts`:

```typescript
const setupDimensionMocks = () => {
  // Mock $.fn.offset, $.fn.width, $.fn.height, $.fn.outerWidth, $.fn.outerHeight
  // Mock $.fn.is(':visible') - critical for Stack._$getArea() visibility check
  // Returns restore function to clean up after test
};
```

**Key insight:** `Stack._$getArea()` checks `this.element.is(':visible')` and returns `null` if not visible, causing drop target calculations to fail. Mocking `:visible` to return `true` for layout elements fixed the tests.

### 2. Meaningful Destruction Validation in afterEach

Changed `cleanupLayout()` in `src/test-utils/testUtils.ts` from swallowing errors to asserting:

```typescript
// Before (hid bugs):
export function cleanupLayout(layout) {
  try {
    if (layout?.isInitialised) layout.destroy();
  } catch {
    /* swallowed */
  }
}

// After (validates destruction):
export function cleanupLayout(layout) {
  if (layout?.isInitialised && layout.root.contentItems.length > 0) {
    layout.destroy();
    expect(layout.root.contentItems.length).toBe(0); // Assert success
  }
}
```

This change revealed a bug in `replaceChild` (see below).

### 3. Fixed replaceChild Event Subscription Bug

**Problem:** When `replaceChild()` swapped a tab's content item, it directly assigned the new reference without transferring event listeners. This caused "No subscriptions to unsubscribe for event destroy" errors during layout destruction.

**Root cause in `AbstractContentItem.replaceChild()`:**

```typescript
// Old code - broke event listener cleanup:
if (isStack(this)) {
  this.header.tabs[index].contentItem = newChild; // Direct assignment
}
```

**Fix:** Added `Tab.setContentItem()` method that properly transfers listeners:

```typescript
// src/controls/Tab.ts
setContentItem(newContentItem: AbstractContentItem) {
  const oldContentItem = this.contentItem;

  // Transfer 'destroy' listener if dragListener exists
  if (this._dragListener) {
    oldContentItem.off('destroy', this._dragListener.destroy, this._dragListener);
    newContentItem.on('destroy', this._dragListener.destroy, this._dragListener);
  }

  // Transfer 'titleChanged' listener
  oldContentItem.off('titleChanged', this.setTitle, this);
  newContentItem.on('titleChanged', this.setTitle, this);

  // Update reference and title
  this.contentItem = newContentItem;
  newContentItem.tab = this;
  this.setTitle(newContentItem.config.title);
}
```

Updated `AbstractContentItem.replaceChild()` to use the new method:

```typescript
if (isStack(this)) {
  this.header.tabs[index].setContentItem(newChild); // Proper transfer
}
```

### 4. Removed Redundant Explicit Destroy Tests

Since `afterEach` now validates destruction after every test, explicit "destroys the layout" tests were redundant. Removed from 13 test files:

- component-creation-events.test.ts
- component-state-save.test.ts
- deferred-create-drag.test.ts
- disabled-selection.test.ts
- drag.test.ts
- empty-item.test.ts
- enabled-selection.test.ts
- event-bubble.test.ts
- id.test.ts
- initialisation.test.ts
- item-creation-events.test.ts
- popout.test.ts
- tab.test.ts
- title.test.ts
- tree-manipulation.test.ts (only "destroys the layout cleanly", kept "Destroys a component and its parent")

**Test count change:** 104 → 89 (removed 15 redundant destroy tests)

---

## Overview

Migrate 21 Karma/Jasmine test files from `/test/` directory to Jest, following patterns established in other packages.

**Current state:** Karma + Jasmine tests in `/test/*.js` requiring pre-built dist
**Target state:** Jest + TypeScript tests colocated with source in `/src/**/*.test.ts`

**Strategy:** Incremental migration - keep Karma running until all tests migrated, then remove.

## Files to Migrate (1:1 Mapping)

| Karma Test File                      | Target Jest File                                  |
| ------------------------------------ | ------------------------------------------------- |
| `initialisation-tests.js`            | `src/__tests__/initialisation.test.ts`            |
| `create-from-config-tests.js`        | `src/__tests__/create-from-config.test.ts`        |
| `selector-tests.js`                  | `src/__tests__/selector.test.ts`                  |
| `enabled-selection-tests.js`         | `src/__tests__/enabled-selection.test.ts`         |
| `disabled-selection-tests.js`        | `src/__tests__/disabled-selection.test.ts`        |
| `event-emitter-tests.js`             | `src/__tests__/event-emitter.test.ts`             |
| `event-bubble-tests.js`              | `src/__tests__/event-bubble.test.ts`              |
| `minifier-tests.js`                  | `src/__tests__/minifier.test.ts`                  |
| `xss_tests.js`                       | `src/__tests__/xss.test.ts`                       |
| `component-creation-events-tests.js` | `src/__tests__/component-creation-events.test.ts` |
| `component-state-save-tests.js`      | `src/__tests__/component-state-save.test.ts`      |
| `item-creation-events-tests.js`      | `src/__tests__/item-creation-events.test.ts`      |
| `tree-manipulation-tests.js`         | `src/__tests__/tree-manipulation.test.ts`         |
| `id-tests.js`                        | `src/__tests__/id.test.ts`                        |
| `empty-item-tests.js`                | `src/__tests__/empty-item.test.ts`                |
| `tab-tests.js`                       | `src/__tests__/tab.test.ts`                       |
| `title-tests.js`                     | `src/__tests__/title.test.ts`                     |
| `drag-tests.js`                      | `src/__tests__/drag.test.ts`                      |
| `deferred-create-drag-tests.js`      | `src/__tests__/deferred-create-drag.test.ts`      |
| `popout-tests.js`                    | `src/__tests__/popout.test.ts`                    |
| `create-config.tests.js`             | `src/__tests__/create-config.test.ts`             |

## Implementation Steps

### Step 1: Create Test Utilities

Create `src/__tests__/testUtils.ts` migrated from `test/test-tools.js`:

```typescript
import GoldenLayout from '../LayoutManager';
import type { ItemConfig } from '../config';

export class TestComponent {
  isTestComponentInstance = true;
  constructor(container: any, state?: { html?: string }) {
    container.getElement().html(state?.html ?? 'that worked');
  }
}

export async function createLayout(config: ItemConfig): Promise<GoldenLayout> {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const layout = new GoldenLayout(config, container);
  layout.registerComponent('testComponent', TestComponent);
  layout.init();

  await waitForLayoutInit(layout);
  return layout;
}

export async function waitForLayoutInit(layout: GoldenLayout): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Layout init timeout')),
      5000
    );
    const check = () => {
      if (layout.isInitialised) {
        clearTimeout(timeout);
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}

export function verifyPath(path: string, layout: GoldenLayout): any {
  // ... (migrate from test-tools.js)
}
```

### Step 2: Convert Syntax Patterns

**Jasmine spies → Jest mocks:**

```javascript
// Before (Jasmine)
spyOn(obj, 'method');
expect(obj.method.calls.length).toBe(1);

// After (Jest)
const spy = jest.spyOn(obj, 'method');
expect(spy).toHaveBeenCalledTimes(1);
```

**Async waitsFor/runs → async/await:**

```javascript
// Before (Jasmine)
runs(function () {
  layout = createLayout(config);
});
waitsFor(function () {
  return layout.isInitialised;
});
runs(function () {
  expect(layout.root).toBeDefined();
});

// After (Jest)
const layout = await createLayout(config);
expect(layout.isInitialised).toBe(true);
expect(layout.root).toBeDefined();
```

**createSpyObj → object with jest.fn():**

```javascript
// Before (Jasmine)
var listener = jasmine.createSpyObj('listener', ['show', 'hide']);

// After (Jest)
const listener = { show: jest.fn(), hide: jest.fn() };
```

### Step 3: Migrate Tests (Recommended Order)

**Phase 1 - Simple unit tests (no DOM):**

1. `minifier-tests.js` → `minifier.test.ts`
2. `xss_tests.js` → `xss.test.ts`
3. `event-emitter-tests.js` → `event-emitter.test.ts`

**Phase 2 - Layout initialization tests:** 4. `initialisation-tests.js` → `initialisation.test.ts` 5. `create-from-config-tests.js` → `create-from-config.test.ts` 6. `create-config.tests.js` → `create-config.test.ts`

**Phase 3 - Item/component tests:** 7. `id-tests.js` → `id.test.ts` 8. `tree-manipulation-tests.js` → `tree-manipulation.test.ts` 9. `item-creation-events-tests.js` → `item-creation-events.test.ts` 10. `component-creation-events-tests.js` → `component-creation-events.test.ts` 11. `component-state-save-tests.js` → `component-state-save.test.ts` 12. `empty-item-tests.js` → `empty-item.test.ts`

**Phase 4 - Event tests:** 13. `event-bubble-tests.js` → `event-bubble.test.ts`

**Phase 5 - UI/selection tests:** 14. `selector-tests.js` → `selector.test.ts` 15. `enabled-selection-tests.js` → `enabled-selection.test.ts` 16. `disabled-selection-tests.js` → `disabled-selection.test.ts` 17. `tab-tests.js` → `tab.test.ts` 18. `title-tests.js` → `title.test.ts`

**Phase 6 - Complex interaction tests:** 19. `drag-tests.js` → `drag.test.ts` 20. `deferred-create-drag-tests.js` → `deferred-create-drag.test.ts` 21. `popout-tests.js` → `popout.test.ts` (with window.open mock)

### Step 4: Mock window.open for Popout Tests

Create mock for `popout.test.ts`:

```typescript
// In popout.test.ts
const mockPopoutWindow = {
  closed: false,
  close: jest.fn(),
  focus: jest.fn(),
  document: {
    write: jest.fn(),
    close: jest.fn(),
    body: document.createElement('body'),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

beforeEach(() => {
  jest
    .spyOn(window, 'open')
    .mockReturnValue(mockPopoutWindow as unknown as Window);
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### Step 5: Update package.json (During Migration)

Keep Karma scripts during migration, rename to make clear they're legacy:

```json
{
  "scripts": {
    "test:karma": "run-s build test-start",
    "test-start": "karma start karma.conf.cjs",
    "test:karma:ci": "run-s build test:ci-start",
    "test:ci-start": "karma start karma.conf.cjs --single-run"
  }
}
```

### Step 6: Delete Karma Files (After All Tests Migrated) - COMPLETE ✓

Removed from `package.json`:

- ✓ Scripts: `test`, `test-start`, `test:ci`, `test:ci-start`
- ✓ devDependencies: `babelify`, `browserify`, `karma-browserify`, `watchify`

Deleted files:

- ✓ `karma.conf.cjs`
- ✓ `test/` directory (entire folder)

## Critical Files

- `src/utils/EventUtils.test.ts` - Reference Jest test pattern (already exists)
- `test/test-tools.js` - Utilities to migrate
- `jest.config.cjs` - Already exists, no changes needed
- `../../jest.config.base.cjs` - Base config with all transforms

## Test Case Inventory (91 Total) - FINAL STATE

All 21 test files have been migrated and refined. 89 tests pass, 2 are skipped (require real browser window), and left commented out.

| File                                | Test Cases               | Notes                         |
| ----------------------------------- | ------------------------ | ----------------------------- |
| `initialisation.test.ts`            | 2                        |                               |
| `event-emitter.test.ts`             | 9                        |                               |
| `event-bubble.test.ts`              | 3                        |                               |
| `create-from-config.test.ts`        | 4                        |                               |
| `component-creation-events.test.ts` | 3                        |                               |
| `component-state-save.test.ts`      | 4                        |                               |
| `item-creation-events.test.ts`      | 4                        |                               |
| `drag.test.ts`                      | 3                        | Enabled with jQuery mocks     |
| `deferred-create-drag.test.ts`      | 3                        | Enabled with jQuery mocks     |
| `popout.test.ts`                    | 3 (2 skipped)            | Skipped need real window.open |
| `tab.test.ts`                       | 2                        |                               |
| `title.test.ts`                     | 7                        |                               |
| `tree-manipulation.test.ts`         | 6                        |                               |
| `selector.test.ts`                  | 8                        |                               |
| `enabled-selection.test.ts`         | 5                        |                               |
| `disabled-selection.test.ts`        | 3                        |                               |
| `id.test.ts`                        | 7                        |                               |
| `minifier.test.ts`                  | 5                        |                               |
| `empty-item.test.ts`                | 3                        |                               |
| `xss.test.ts`                       | 5                        |                               |
| `create-config.test.ts`             | 1                        |                               |
| **TOTAL**                           | **91 (89 pass, 2 skip)** | **21/21 suites**              |

**Skipped tests:** `popout.test.ts` has 2 skipped tests that require a real browser window (window.open must load a full application and initialize GoldenLayout in the popup).

## Verification Process

### Per-File Migration Verification

For each file migrated:

1. **Count test cases before migration:**

   ```bash
   grep -c "it('" test/<filename>.js
   ```

2. **Count test cases after migration:**

   ```bash
   grep -c "it('" src/__tests__/<filename>.test.ts
   ```

3. **Verify test names match:** Compare the `it('...')` strings between old and new files

4. **Run both test suites and compare results:**

   ```bash
   # Run Karma test for specific file
   npm run test:karma

   # Run Jest test for specific file
   npx jest packages/golden-layout/src/__tests__/<filename>.test.ts
   ```

### Test Name Preservation

Preserve exact test names to make verification easy. Example:

```javascript
// Karma (before)
it('creates a layout', function() { ... });

// Jest (after) - KEEP THE SAME NAME
it('creates a layout', async () => { ... });
```

### Final Verification Steps

1. **Run Jest and count passing tests:**

   ```bash
   npx jest packages/golden-layout --verbose 2>&1 | grep -c "✓"
   ```

   Expected: 102 passing tests (100 active + 2 skipped from popout)

2. **Compare with Karma results:**

   ```bash
   npm run test:karma 2>&1 | grep "Executed"
   ```

   Should show same number of specs

3. **Generate coverage reports for both:**
   ```bash
   # Jest coverage
   npx jest packages/golden-layout --coverage
   ```

## Common Migration Pitfalls

### 1. Shared State Between Tests

Many Karma tests share layout instances across `it()` blocks using `runs()`. In Jest, each test should be independent:

```typescript
// BAD - shared state
let layout: GoldenLayout;
it('creates layout', () => {
  layout = createLayout(config);
});
it('uses layout', () => {
  expect(layout.root).toBeDefined();
}); // May fail!

// GOOD - independent tests
it('creates layout', async () => {
  const layout = await createLayout(config);
  expect(layout.root).toBeDefined();
  layout.destroy();
});
```

### 2. Cleanup After Each Test

Always destroy layouts to prevent DOM pollution. Use `cleanupLayout()` from testUtils which also validates destruction:

```typescript
import { cleanupLayout } from '../test-utils/testUtils';

let layout: LayoutManager | null = null;

afterEach(() => {
  cleanupLayout(layout); // Validates destruction succeeded
  layout = null;
});
```

### 3. The 2 Skipped Popout Tests

`popout-tests.js` has 2 `xit` tests that were skipped due to Karma environment issues:

- "serialises the new window"
- "closes the open window"

Attempt to enable these in Jest with proper window.open mocking. If they still fail, keep them as `it.skip()` with a comment explaining why.

### 4. Event Timing

Some tests check event firing order. Use `jest.fn()` with `mockImplementation` to track call order:

```typescript
const calls: string[] = [];
const listener = {
  show: jest.fn(() => calls.push('show')),
  hide: jest.fn(() => calls.push('hide')),
};
// Later: expect(calls).toEqual(['show', 'hide']);
```

### 5. jQuery DOM Assertions

Convert jQuery assertions to Jest DOM matchers:

```javascript
// Karma
expect(container.getElement().html()).toBe('content');

// Jest
expect(container.getElement()[0].innerHTML).toBe('content');
// or with @testing-library/jest-dom
expect(container.getElement()[0]).toHaveTextContent('content');
```

## Notes

- The existing `EventUtils.test.ts` serves as the pattern for all new tests
- Jest config already exists and extends base config correctly
- Browser APIs (ResizeObserver, matchMedia, etc.) are already mocked in `jest.setup.ts`
- CSS/SCSS imports handled by `identity-obj-proxy` in base config
- **Total test cases to migrate: 102** (100 active + 2 skipped)
- **Final test cases after migration: 89** (89 active + 2 skipped, commented out)
