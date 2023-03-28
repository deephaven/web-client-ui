# @deephaven/jsapi-utils

A library with some JS utility methods for interacting with the JSAPI.

## Install

```bash
npm install --save @deephaven/jsapi-utils
```

## Usage

```javascript
import { TableUtils } from '@deephaven/jsapi-utils';

if (TableUtils.isDateType(columnType)) {
  console.log('Date type', columnType);
} else if (TableUtils.isNumberType(columnType)) {
  console.log('Number type', columnType);
} else {
  console.log('Unrecognized type', columnType);
}
```
