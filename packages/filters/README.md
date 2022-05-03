# @deephaven/filters

A library for defining filters. Does not provide actual filter implementation, just the types and some utility methods.

## Install

```bash
npm install --save @deephaven/filters
```

## Usage

```javascript
import { getLabelForTextFilter, FilterType } from '@deephaven/filters';

console.log('Label is', getLabelForTextFilter(FilterType.contains));
```
