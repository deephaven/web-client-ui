# How to vertically stack tables

This guide discusses how to stack ([merge](https://deephaven.io/core/docs/reference/table-operations/merge/merge)) tables one on top of the other into one aggregate table.

The basic syntax follows.

`t = merge(tables...)`

- all of the source tables must have the same schema - column names and column types.
- `NULL` inputs are ignored.

**Note**: Python users need to import the appropriate method: `from deephaven.TableTools import merge`

The resulting table is all of the source tables stacked vertically. If the source tables dynamically change, such as for ticking data, rows will be inserted _within_ the stack. For example, if a row is added to the end of the third source table, in the resulting table, that new row appears after all other rows from the third source table and before all rows from the fourth source table.

## Source tables

Let's start with the following source tables:

```python
from deephaven.TableTools import merge, mergeSorted, newTable, col

source1 = newTable(col("Letter", "A", "B", "D"), col("Number", 1, 2, 3))
source2 = newTable(col("Letter", "C", "D", "E"), col("Number", 14, 15, 16))
source3 = newTable(col("Letter", "E", "F", "A"), col("Number", 22, 25, 27))
```

The sections below discuss basic merge operations, and how to merge tables effectively, especially when you have many tables to combine.

## Merge tables

The above source tables can be combined, or vertically stacked, by providing each table as an argument to the [`merge`](https://deephaven.io/core/docs/reference/table-operations/merge/merge) method.

**Note**: The columns for each table need to have the same names and types, or a column mismatch error will occur.

The following query merges two tables:

```python
result = merge(source1, source2)
```

The following query merges three tables:

```python
result = merge(source1, source2, source3)
```

Similarly, [`merge`](https://deephaven.io/core/docs/reference/table-operations/merge/merge) can be applied to an array of tables.

```python
tables = [source1, source2, source3]
result = merge(tables)
```

### Merge with null tables

When merging tables, null tables are ignored.

In this case, `result` will contain the same data as `source`.

```python
source = newTable(col("Letter", "A", "B", "D"), col("Number", 1, 2, 3))

result = merge(None, source)
```

## Perform efficient merges

When performing more than one [`merge`](https://deephaven.io/core/docs/reference/table-operations/merge/merge) operation, it is best to perform all the merges at the same time, rather than nesting several merges.

In this example, a table named `result` is initialized. As new tables are generated, the results are merged at every iteration. Calling the [`merge`](https://deephaven.io/core/docs/reference/table-operations/merge/merge) method on each iteration makes this example inefficient.

```python
result = None

for i in range(5):
   newResult = newTable(col("Code", f"A{i}", f"B{i}"), col("Val", i, 10*i))
   result = merge(result, newResult)
```

Instead, we can make the operation more efficient by calling the [`merge`](https://deephaven.io/core/docs/reference/table-operations/merge/merge) method just once. Here [`merge`](https://deephaven.io/core/docs/reference/table-operations/merge/merge) is applied to an array containing all of the source tables.

```python
tableArray = []

for i in range(5):
   newResult = newTable(col("Code", f"A{i}", f"B{i}"), col("Val", i, 10*i))
   tableArray.append(newResult)

result = merge(tableArray)
```

## Related documentation

- [Create a new table](https://deephaven.io/core/docs/reference/table-operations/create/new-table)
- [merge](https://deephaven.io/core/docs/reference/table-operations/merge/merge)
- [mergeSorted](https://deephaven.io/core/docs/reference/table-operations/merge/merge-sorted)
- [Javadocs](<https://deephaven.io/core/javadoc/io/deephaven/db/tables/utils/TableTools.html#merge(java.util.Collection)>)
- [Pydocs](https://deephaven.io/core/pydoc/code/deephaven.TableTools.html?highlight=merge#deephaven.TableTools.merge)
