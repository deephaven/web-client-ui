# `@deephaven/mocks`

Some mocks used by Deephaven Data Labs for common modules.

## Usage

Install dependencies:
```
npm install --save-dev @deephaven/mocks
```

Then in your `__mocks__` directory, add files as necessary to mock out modules:

```
// File: __mocks__/lodash.debounce.js
export { lodashDebounce as default } from '@deephaven/mocks';
```