---
applyTo: "packages/**/*.{ts,tsx,js,jsx}"
---

# Code quality review

- Review changed source as a code quality specialist.
- Check that the change matches established patterns in the same package before recommending a new abstraction.
- Prefer focused functions/components, descriptive names, and clear data flow over clever or overly dense logic.
- Flag copy/pasted logic when an existing utility, hook, model, or component would be a better fit.
- Check for maintainable error handling and cleanup, especially around async code, event listeners, and subscriptions.
- In React code, prefer patterns already used nearby for hooks, props, memoization, and state ownership.
- In stateful cross-cutting code, ensure reducers, selectors, and plugin registration remain easy to follow.
- Avoid nitpicks about formatting or trivial style unless they hide a real maintenance problem.
