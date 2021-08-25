# How to select, view, and update data in tables

Analysis of data in queries often requires creating new tables from some or all of the columns in existing tables. The Deephaven API offers a variety of methods that can achieve this. In this guide, five are discussed:

- [`select`](https://deephaven.io/core/docs/reference/table-operations/select/select)
- [`view`](https://deephaven.io/core/docs/reference/table-operations/select/view)
- [`update`](https://deephaven.io/core/docs/reference/table-operations/select/update)
- [`updateView`](https://deephaven.io/core/docs/reference/table-operations/select/update-view)
- [`lazyUpdate`](https://deephaven.io/core/docs/reference/table-operations/select/lazy-update)

**Note**: The methods in this guide store results in different ways that can have a huge impact on query performance. The purpose of this guide is to show how to use these methods, not how to pick the best one for your needs.

The examples in this guide use a table called `students` created using [`newTable`](https://deephaven.io/core/docs/reference/table-operations/create/newTable). The `students` table contains data on four students in a class. If you are unfamiliar with the method, check out our guide [Create a new table](https://deephaven.io/core/docs/reference/table-operations/create/newTable).

```python
from deephaven.TableTools import newTable, intCol, doubleCol, stringCol

students = newTable(
    stringCol("Name", "Andy", "Claire", "Jane", "Steven"),
    intCol("StudentID", 1, 2, 3, 4),
    intCol("TestGrade", 85, 95, 88, 72),
    intCol("HomeworkGrade", 85, 95, 90, 95),
    doubleCol("GPA", 3.0, 4.0, 3.7, 2.8)
)
```

## Create a table from columns of a source table

The [`select`](https://deephaven.io/core/docs/reference/table-operations/select/select) and [`view`](https://deephaven.io/core/docs/reference/table-operations/select/view) methods allow the user to create a new table containing columns derived from columns in a source table. The examples below show how to use these methods to select two columns from the source table and create a third to determine if a student passed the class.

Notice how the tables `studentsPassedSelect` and `studentsPassedView` contain the same data. The [`select`](https://deephaven.io/core/docs/reference/table-operations/select/select) and [`view`](https://deephaven.io/core/docs/reference/table-operations/select/view) methods return tables that appear identical, but they differ in how they store their results.

- [`select`](https://deephaven.io/core/docs/reference/table-operations/select/select) computes and stores the result in memory.
- [`view`](https://deephaven.io/core/docs/reference/table-operations/select/view) saves formulas that are recomputed from data in the source table every time a cell is accessed.

### `select`

```python
studentsPassedSelect = students.select("Name", "GPA", "Passed = GPA >= 3.0")
```

### `view`

```python
studentsPassedView = students.view("Name", "GPA", "Passed = GPA >= 3.0")
```

## Add columns to a table

The [`update`](https://deephaven.io/core/docs/reference/table-operations/select/update), [`updateView`](https://deephaven.io/core/docs/reference/table-operations/select/update-view), and [`lazyUpdate`](https://deephaven.io/core/docs/reference/table-operations/select/lazy-update) methods allow the user to add one or more columns to a source table. The examples below show how these three methods keep all of the data from the source table and add an additional column.

Notice how `studentsPassedUpdate`, `studentsPassedUpdateView`, and `studentsPassedLazyUpdate` contain all columns from the `students` table and one additional column. The [`update`](https://deephaven.io/core/docs/reference/table-operations/select/update), [`updateView`](https://deephaven.io/core/docs/reference/table-operations/select/update-view), and [`lazyUpdate`](https://deephaven.io/core/docs/reference/table-operations/select/lazy-update) methods return tables that appear identical, but they differ in how they store their results.

- [`update`](https://deephaven.io/core/docs/reference/table-operations/select/update) computes and stores the new columns in memory.
- [`updateView`](https://deephaven.io/core/docs/reference/table-operations/select/update-view) saves the new columns as formulas that are recomputed from data in the source table every time a cell is accessed.
- [`lazyUpdate`](https://deephaven.io/core/docs/reference/table-operations/select/lazy-update) caches new column formula evaluations so that each set of formula inputs is computed at most once.

### `update`

```python
studentsPassedUpdate = students.update("Passed = GPA >= 3.0")
```

### `updateView`

```python
studentsPassedUpdateView = students.updateView("Passed = GPA >= 3.0")
```

### `lazyUpdate`

```python
studentsPassedLazyUpdate = students.lazyUpdate("Passed = GPA >= 3.0")
```

## Related documentation

- [Create a new table](https://deephaven.io/core/docs/reference/table-operations/create/new-table)
- [select](https://deephaven.io/core/docs/reference/table-operations/select/select)
- [view](https://deephaven.io/core/docs/reference/table-operations/select/view)
- [update](https://deephaven.io/core/docs/reference/table-operations/select/update)
- [updateView](https://deephaven.io/core/docs/reference/table-operations/select/update-view)
- [lazyUpdate](https://deephaven.io/core/docs/reference/table-operations/select/lazy-update)
