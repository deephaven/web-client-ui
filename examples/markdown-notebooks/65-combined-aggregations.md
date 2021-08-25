# How to perform multiple aggregations for groups

This guide will show you how to collect summary information for groups of data using combined aggregations.

Often when working with data, you will want to break the data into subgroups and then perform calculations on the grouped data. For example, a large multi-national corporation may want to know their average employee salary by country, or a teacher might want to analyze test scores for various classes.

The process of breaking a table into subgroups and then performing one or more calculations on the subgroups is known as "combined aggregation." The term comes from most operations creating a summary of data within a group (aggregation), and from more than one operation being computed at once (combined).

## Why use combined aggregations?

Deephaven provides many [dedicated aggregations](https://deephaven.io/core/docs/how-to-guides/dedicated-aggregations), such as [`maxBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/maxBy) and [`minBy`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/minBy). These are good options if only one type of aggregation is needed. If more than one aggregation is needed or if you have a custom aggregation, combined aggregations are a more efficient and more flexible solution.

## Syntax

Combined aggregators need to be wrapped inside the [`AggCombo`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggCombo) method to format the results as an argument for the [`by`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by) method:

The general syntax follows:

```python
source.by(                                       # group the source table using .by
    AggCombo(                                    # create a collection of aggregators
        AggMin(sourceColumns),                   # first aggregation
        AggMax("inputColumn = outputColumn")),   # second aggregation
        groupingColumns...)
```

> **Note**: Multiple aggregations can be used inside [`AggCombo`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggCombo). See our reference documentation.

## What aggregations are available?

A number of built-in aggregations are available:

- [`AggArray`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggArray) - Array of values for each group.
- [`AggAvg`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggAvg) - Average value for each group.
- [`AggWAvg`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggWAvg) - Weighted average for each group.
- [`AggCount`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggCount) - Number of rows for each group.
- [`AggCountDistinct`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggCountDistinct) - Number of unique values for each group.
- [`AggDistinct`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggDistinct) - Array of unique values for each group.
- [`AggFirst`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggFirst) - First value for each group.
- [`AggFormula`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggFormula) - A formula for each group.
- [`AggLast`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggLast) - Last value for each group.
- [`AggMax`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggMax) - Maximum value for each group.
- [`AggMed`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggMed) - Median value for each group.
- [`AggMin`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggMin) - Minimum value for each group.
- [`AggPct`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggPct) - Percentile of values for each group.
- [`AggStd`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggStd) - Standard deviation for each group.
- [`AggSum`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggSum) - Sum of values for each group.
- [`AggUnique`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggUnique) - Returns one single value for a column, or a default.
- [`AggVar`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggVar) - Variance for each group.
- [`AggWSum`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggWSum) - Weighted sum for each group.

## Example 1

In this example, we have math and science test results for classes during periods 1 and 2. We want to summarize this information to see if students perform better in one period or the other.

Although designed for multiple, simultaneous aggregations, [`AggCombo`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggCombo) can also be used for a single aggregation. In this first example, we group and [average](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggAvg) the test scores by `Period`.

```python
from deephaven.TableTools import newTable, stringCol, intCol, doubleCol
from deephaven import ComboAggregateFactory as caf

source = newTable(
    stringCol("Period", "1", "2", "2", "2", "1", "2", "1", "2", "1"),
    stringCol("Subject", "Math", "Math", "Math", "Science", "Science", "Science", "Math", "Science", "Math"),
    intCol("Test", 55, 76, 20, 90, 83, 95, 73, 97, 84),
)

result = source.by(caf.AggCombo(caf.AggAvg("AVG = Test")), "Period")
```

The data can also be grouped and [averaged](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggAvg) by `Subject`.

```python
from deephaven.TableTools import newTable, stringCol, intCol, doubleCol
from deephaven import ComboAggregateFactory as caf

source = newTable(
    stringCol("Period", "1", "2", "2", "2", "1", "2", "1", "2", "1"),
    stringCol("Subject", "Math", "Math", "Math", "Science", "Science", "Science", "Math", "Science", "Math"),
    intCol("Test", 55, 76, 20, 90, 83, 95, 73, 97, 84),
)

result = source.by(caf.AggCombo(caf.AggAvg("AVG = Test")), "Subject")
```

We can also group the data by `Subject` and `Period` to see the total [average](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggAvg) in a period and subject.

```python
from deephaven.TableTools import newTable, stringCol, intCol, doubleCol
from deephaven import ComboAggregateFactory as caf

source = newTable(
    stringCol("Period", "1", "2", "2", "2", "1", "2", "1", "2", "1"),
    stringCol("Subject", "Math", "Math", "Math", "Science", "Science", "Science", "Math", "Science", "Math"),
    intCol("Test", 55, 76, 20, 90, 83, 95, 73, 97, 84),
)

result = source.by(caf.AggCombo(caf.AggAvg("AVG = Test")), "Subject", "Period")
```

## Example 2

In this example, we want to know the first and last test results for each subject and period. To achieve this, we can use [`AggFirst`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggFirst) to return the first test value and [`AggLast`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggLast) to return the last test value. The results are grouped by `Subject` and `Period`, so there are four results in this example.

```python
from deephaven.TableTools import newTable, stringCol, intCol, doubleCol
from deephaven import ComboAggregateFactory as caf

source = newTable(
    stringCol("Period", "1", "2", "2", "2", "1", "2", "1", "2", "1"),
    stringCol("Subject", "Math", "Math", "Math", "Science", "Science", "Science", "Math", "Science", "Math"),
    intCol("Test", 55, 76, 20, 90, 83, 95, 73, 97, 84),
)

result = source.by(caf.AggCombo(caf.AggFirst("FirstTest = Test"), caf.AggLast("LastTest = Test")), "Subject", "Period")
```

## Example 3

In this example, tests are weighted differently in computing the final grade.

- The weights are in the `Weight` column.
- [`AggWAvg`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggWAvg) is used to compute the weighted average test score, stored in the `WAvg` column.
- [`AggAvg`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggAvg) is used to compute the unweighted average test score, stored in the `Avg` column.
- [`AggCount`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggCount) is used to compute the number of tests in each group.
- Test results are grouped by `Period`.

```python
from deephaven.TableTools import newTable, stringCol, intCol, doubleCol
from deephaven import ComboAggregateFactory as caf

source = newTable(
    stringCol("Period", "1", "2", "2", "2", "1", "2", "1", "2", "1"),
    stringCol("Subject", "Math", "Math", "Math", "Science", "Science", "Science", "Math", "Science", "Math"),
    intCol("Test", 55, 76, 20, 90, 83, 95, 73, 97, 84),
    intCol("Weight", 1, 2, 1, 3, 2, 1, 4, 1, 2),
)

result = source.by(caf.AggCombo(caf.AggWAvg("Weight", "WAvg = Test"), caf.AggAvg("Avg = Test"), caf.AggCount("NumTests")), "Period")
```

## Related documention

- [Create a new table](https://deephaven.io/core/docs/how-to-guides/new-table)
- [How to perform dedicated aggregations](https://deephaven.io/core/docs/how-to-guides/dedicated-aggregations)
- [AggCombo](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/AggCombo)
- [by](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by)
