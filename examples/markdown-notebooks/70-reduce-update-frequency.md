# How to reduce the update frequency of ticking tables

This guide will show you how to reduce the update frequency of ticking tables.

When a table updates, all of the children of the table, which depend upon the table as a data source, must be updated. For fast-changing data, this can mean a lot of computing to keep child tables up to date. Table snapshots allow the update frequency of a table to be reduced, which results in fewer updates of child tables. This can be useful when processing fast-changing data on limited hardware.

## Syntax

The [`snapshot`](https://deephaven.io/core/docs/reference/table-operations/snapshot/snapshot) operation produces an in-memory copy of a table (`source`), which refreshes every time another table (`trigger`) ticks.

```python
result = trigger.snapshot(source)
result = trigger.snapshot(source, doInitialSnapshot)
```

> **Note**: The trigger table is often a [time table](https://deephaven.io/core/docs/reference/table-operations/create/timeTable), a special type of table that adds new rows at a regular, user-defined interval. The sole column of a time table is `Timestamp`.

> **Caution**: Columns from the trigger table appear in the result table. If the trigger and source tables have columns with the same name, an error will be raised. To avoid this problem, rename conflicting columns.

## Sample at a regular interval

In this example, the `source` table updates every 0.5 seconds with new data. The `trigger` table updates every 5 seconds, triggering a new snapshot of the `source` table (`result`). This design pattern is useful for reducing the amount of data that must be processed.

```python
from deephaven.TableTools import timeTable
import random

source = timeTable("00:00:0.5").update("X = (int) random.randint(0, 100)", "Y = sqrt(X)")

trigger = timeTable("00:00:05").renameColumns("TriggerTimestamp = Timestamp")

result = trigger.snapshot(source)
```

## Create a static snapshot

This example creates a static snapshot of the data table at the instant `snapshot` is called. Here, [`emptyTable`](https://deephaven.io/core/docs/reference/table-operations/create/emptyTable) creates the trigger table. Since [`emptyTable`](https://deephaven.io/core/docs/reference/table-operations/create/emptyTable) creates a table (`staticData`) that never changes, the snapshot does not update. The `doInitialSnapshot = True` argument causes `snapshot` to create a snapshot without requiring the trigger table to first tick. The trigger table never changes so the snapshot will not change.

The second argument to `snapshot`, `doInitialSnapshot`, can be either `True` or `False`:

- `True` means the snapshot will be created both when the trigger table ticks and when initially called.
- `False` means the snapshot will be created only when the trigger table ticks. The default value is `false`.

First, create the dynamic `source` table. Then when desired, freeze the dynamic table and take a snapshot, creating a static table.

> **Caution**: `emptyTable(0).snapshot(source, True)` will return a static snapshot when it is called. If there is no data in `source`, the snapshot will be empty. When running this example, wait until the `source` table populates before running the snapshot. In the image below, 10 seconds elapsed before executing the snapshot.

```python
from deephaven.TableTools import timeTable, emptyTable
import random

source = timeTable("00:00:01").update("X = (int) random.randint(0, 100)", "Y = sqrt(X)")
```

Wait the desired seconds for the `source` table to populate values, then execute the `snapshot` method.

```python
staticData = emptyTable(0).snapshot(source, True)
```

## Related documentation

- [Create a time table](https://deephaven.io/core/docs/how-to-guides/time-table)
- [Capture the history of ticking tables](https://deephaven.io/core/docs/how-to-guides/capture-table-history)
- [emptyTable](https://deephaven.io/core/docs/reference/table-operations/create/emptyTable)
- [renameColumns](https://deephaven.io/core/docs/reference/table-operations/select/rename-columns)
- [snapshot](https://deephaven.io/core/docs/reference/table-operations/snapshot/snapshot)
- [snapshotHistory](https://deephaven.io/core/docs/reference/table-operations/snapshot/snapshotHistory)
- [timeTable](https://deephaven.io/core/docs/reference/table-operations/create/timeTable)
- [update](https://deephaven.io/core/docs/reference/table-operations/select/update)
