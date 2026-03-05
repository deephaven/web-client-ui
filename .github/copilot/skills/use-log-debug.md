# Skill: Use log.debug Instead of console.log

When adding debug logging in JavaScript/TypeScript files in this codebase, use the `@deephaven/log` module instead of `console.log` or `console.debug`.

## Pattern

1. **Import the Log module** at the top of the file:
   ```typescript
   import Log from '@deephaven/log';
   ```

2. **Create a module-specific logger** after imports:
   ```typescript
   const log = Log.module('ModuleName');
   ```
   Replace `'ModuleName'` with the name of the current file/module (e.g., `'ChartUtils'`, `'TableUtils'`).

3. **Use the logger** for debug output:
   ```typescript
   log.debug('message', data);
   log.debug2('more verbose message', data);  // For very verbose logging
   ```

## Why

- Consistent logging across the codebase
- Log levels can be configured at runtime
- Module-specific filtering is possible
- Avoids ESLint `no-console` warnings
- Better production behavior (logs can be silenced)

## Example

```typescript
import Log from '@deephaven/log';

const log = Log.module('MyComponent');

function processData(data: SomeType): void {
  log.debug('Processing data:', data);
  // ... processing logic
  log.debug2('Detailed step completed');
}
```

## Avoid

```typescript
// ❌ Don't use console directly
console.log('Processing data:', data);
console.debug('Step completed');

// ❌ Don't add eslint-disable for console
// eslint-disable-next-line no-console
console.log('debug info');
```
