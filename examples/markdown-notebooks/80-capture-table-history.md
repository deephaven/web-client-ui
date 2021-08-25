# How to capture the history of ticking tables

This guide will show you how to capture the history of ticking tables.

Append-only tables are very simple. New rows are added at the bottom of the table, and rows are never deleted or modified. This makes examining the history of append-only tables very easy. If a table is not append-only, rows are added, deleted, and modified, which makes examining the history more complex. By using [`snapshotHistory`](https://deephaven.io/core/docs/reference/table-operations/snapshot/snapshotHistory), you can capture the history of a table, even if it is not append-only.

## Syntax

The [`snapshotHistory`](https://deephaven.io/core/docs/reference/table-operations/snapshot/snapshotHistory) operation produces an in-memory table containing the history of the source table. Values are added to the history every time the trigger table ticks.

```python
history = trigger.snapshotHistory(source)
```

> **Note**: The trigger table is often a [time table](https://deephaven.io/core/docs/reference/table-operations/create/timeTable), a special type of table that adds new rows at a regular, user-defined interval. The sole column of a time table is `Timestamp`.

> **Caution**: Columns from the trigger table appear in the result table. If the trigger and source tables have columns with the same name, an error will be raised. To avoid this problem, rename conflicting columns.

> **Caution**: Because [`snapshotHistory`](https://deephaven.io/core/docs/reference/table-operations/snapshot/snapshot) stores a copy of the source table for every trigger event, large source tables or rapidly changing trigger tables can result in large memory usage.

## Include a history

In this example, there are two input tables. The `source` table updates every 0.01 seconds with new data. The `trigger` table updates every second, triggering a new snapshot of the `source` table to be added to the `result` table. This design pattern is useful for examining the history of a table.

```python
from deephaven.TableTools import timeTable
import random

source = timeTable("00:00:00.01").update("X = i%2 == 0 ? `A` : `B`", "Y = (int) random.randint(0, 100)", "Z = sqrt(Y)").lastBy("X")

trigger = timeTable("00:00:01").renameColumns("TriggerTimestamp = Timestamp")

result = trigger.snapshotHistory(source)
```

## Related documentation

- [Create a time table](https://deephaven.io/core/docs/how-to-guides/time-table)
- [Reduce the update frequency of ticking tables](https://deephaven.io/core/docs/how-to-guides/reduce-update-frequency)
- [renameColumn](https://deephaven.io/core/docs/reference/table-operations/select/rename-columns)
- [snapshot](https://deephaven.io/core/docs/reference/table-operations/snapshot/snapshot)
- [snapshotHistory](https://deephaven.io/core/docs/reference/table-operations/snapshot/snapshotHistory)
- [timeTable](https://deephaven.io/core/docs/reference/table-operations/create/timeTable)
- [update](https://deephaven.io/core/docs/reference/table-operations/select/update)
