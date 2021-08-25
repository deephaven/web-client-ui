# How to perform dedicated aggregations for groups

This guide will show you how to compute summary information on groups of data using dedicated data aggregations.

Often when working with data, you will want to break the data into subgroups and then perform calculations on the grouped data. For example, a large multi-national corporation may want to know their average employee salary by country, or a teacher might want to calculate grade information for groups of students or in certain subject areas.

The process of breaking a table into subgroups and then performing a single type of calculation on the subgroups is known as "dedicated aggregation." The term comes from most operations creating a summary of data within a group (aggregation) and from a single type of operation being computed at once (dedicated).

## Why use dedicated aggregations?

Deephaven provides many dedicated aggregations, such as [`maxBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/maxBy) and [`minBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/minBy). These aggregations are good options if only one type of aggregation is needed. If more than one type of aggregation is needed or if you have a custom aggregation, [combined aggregations](https://deephaven.io/core/docs/how-to-guides/combined-aggregations) are a more efficient and more flexible solution.

## Syntax

The general syntax is `result = source.firstBy(columnNames...)`

The `columnNames` parameter determines the column(s) by which to group data.

- `NULL` uses the whole table as a single group
- `"X"` will output the desired value for each group in column `X`.
- `"X", "Y"` will output the desired value for each group designated from the `X` and `Y` columns.

## What aggregations are available?

Each dedicated aggregator performs one calculation at a time:

- [`firstBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/firstBy) - First row of each group.
- [`lastBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/lastBy) - Last row of each group.
- [`headBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/headBy) - First `n` rows of each group.
- [`tailBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/tailBy) - Last `n` rows of each group.
- [`countBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/countBy) - Number of rows in each group.
- [`sumBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/sumBy) - Sum of each group.
- [`avgBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/avgBy) - Average (mean) of each group.
- [`stdBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/stdBy) - Standard deviation of each group.
- [`varBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/varBy) - Variance of each group.
- [`medianBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/medianBy) - Median of each group.
- [`minBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/minBy) - Minimum value of each group.
- [`maxBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/maxBy) - Maximum value of each group.

## Dedicated aggregators

In the following examples, we have test results in various subjects for some students. We want to summarize this information to see if students perform better in one class or another.

```python
from deephaven.TableTools import newTable, stringCol, intCol, doubleCol
from deephaven import ComboAggregateFactory as caf

source = newTable(
    stringCol("Name", "James", "James", "James", "Lauren", "Lauren", "Lauren", "Zoey", "Zoey", "Zoey"),
    stringCol("Subject", "Math", "Science", "Art", "Math", "Science", "Art", "Math", "Science", "Art"),
    intCol("Number", 95, 100, 90, 72, 78, 92, 100, 98, 96),
)
```

### `firstBy` and `lastBy`

In this example, we want to know the first and the last test results for each student. To achieve this, we can use [`firstBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/firstBy) to return the first test value and [`lastBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/lastBy) to return the last test value. The results are grouped by `Name`.

```python
first = source.firstBy("Name")
last = source.lastBy("Name")
```

### `headBy` and `tailBy`

In this example, we want to know the first two and the last two test results for each student. To achieve this, we can use [`headBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/headBy) to return the first `n` test values and [`tailBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/tailBy) to return the last `n` test value. The results are grouped by `Name`.

```python
head = source.headBy(2, "Name")
tail = source.tailBy(2, "Name")
```

### `countBy`

In this example, we want to know the number of tests each student completed. [`countBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/countBy) returns the number of rows in the table as grouped by `Name` and stores that in a new column, `NumTests`.

```python
count = source.countBy("NumTests", "Name")
```

## Summary statistics aggregators

In the following examples, we start with the same source table containing students' test results as used above.

> **Caution**: Applying these aggregations to a column where the average cannot be computed will result in an error. For example, the average is not defined for a column of string values. For more information on removing columns from a table, see [`dropColumns`](https://deephaven.io/core/docs/reference/table-operations/select/drop-columns). The syntax for using [`dropColumns`](https://deephaven.io/core/docs/reference/table-operations/select/drop-columns) is `result = source.dropColumns(droppedColumnNames...).sumBy(columnNames...)`

### `sumBy`

In this example, [`sumBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/sumBy) calculates the total sum of test scores for each `Name`. Because a sum cannot be computed for the string column `Subject`, this column is dropped before applying [`sumBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/sumBy).

```python
sum = source.dropColumns("Subject").sumBy("Name")
```

### `avgBy`

In this example, [`avgBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/avgBy) calculates the average (mean) of test scores for each `Name`. Because an average cannot be computed for the string column `Subject`, this column is dropped before applying [`avgBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/avgBy).

```python
mean = source.dropColumns("Subject").avgBy("Name")
```

### `stdBy`

In this example, [`stdBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/stdBy) calculates the standard deviation of test scores for each `Name`. Because a standard deviation cannot be computed for the string column `Subject`, this column is dropped before applying [`stdBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/stdBy).

```python
stdDev = source.dropColumns("Subject").stdBy("Name")
```

### `varBy`

In this example, [`varBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/varBy) calculates the variance of test scores for each `Name`. Because a variance cannot be computed for the string column `Subject`, this column is dropped before applying [`varBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/varBy).

```python
var = source.dropColumns("Subject").varBy("Name")
```

### `medianBy`

In this example, [`medianBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/medianBy) calculates the median of test scores for each `Name`. Because a median cannot be computed for the string column `Subject`, this column is dropped before applying [`medianBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/medianBy).

```python
median = source.dropColumns("Subject").medianBy("Name")
```

### `minBy`

In this example, [`minBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/minBy) calculates the minimum of test scores for each `Name`. Because a minimum cannot be computed for the string column `Subject`, this column is dropped before applying [`minBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/minBy).

```python
minimum = source.dropColumns("Subject").minBy("Name")
```

### `maxBy`

In this example, [`maxBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/maxBy) calculates the maximum of test scores for each `Name`. Because a maximum cannot be computed for the string column `Subject`, this column is dropped before applying [`maxBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/maxBy) .

```python
maximum = source.dropColumns("Subject").maxBy("Name")
```

## Related documentation

- [How to create multiple summary statistics for groups](https://deephaven.io/core/docs/how-to-guides/combined-aggregations)
- [avgBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/avgBy)
- [countBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/countBy)
- [dropColumns](https://deephaven.io/core/docs/reference/table-operations/select/drop-columns)
- [firstBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/firstBy)
- [headBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/headBy)
- [lastBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/lastBy)
- [maxBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/maxBy)
- [medianBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/medianBy)
- [minBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/minBy)
- [stdBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/stdBy)
- [sumBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/sumBy)
- [tailBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/tailBy)
- [varBy](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/varBy)
