---
applyTo: "packages/**/*.ts,packages/**/*.tsx,packages/**/*.js,packages/**/*.jsx"
---

# Code quality review

- Compare the change against established patterns in the same package before recommending a new abstraction; consistency with neighbors beats novelty.
- Flag copy/pasted logic when an existing utility, hook, model, or component in a workspace package would be a better fit.
- Flag missing cleanup around async code, event listeners, timers, and JS API subscriptions — components must release resources on unmount, and async results must not be applied after cancellation/unmount.
- Flag swallowed errors: empty `catch` blocks, unhandled promise rejections, or errors logged without being surfaced where the user or caller needs them.
- In React code, prefer the hook, memoization, and state-ownership patterns already used nearby; flag state lifted higher or duplicated wider than necessary.
- In Redux and plugin code, reducers, selectors, and registrations must remain easy to trace; flag indirection that hides where state changes.
- Prefer focused functions/components, descriptive names, and clear data flow over clever or dense logic.
- Do not comment on formatting or trivial style — Prettier/ESLint/Stylelint enforce those in CI.
