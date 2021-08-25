# How to group and ungroup data

This guide will show you how to group and ungroup table data in Deephaven.

This guide uses a table of apple data called `apples` created using [`newTable`](https://deephaven.io/core/docs/reference/table-operations/create/newTable). Many of the grouping and ungrouping examples use this table. If you are unfamiliar with creating tables from scratch using [`newTable`](https://deephaven.io/core/docs/reference/table-operations/create/newTable), please see our guide [Create a new table](https://deephaven.io/core/docs/reference/table-operations/create/new-table).

Use the code below to create the `apples` table:

```python
from deephaven.TableTools import newTable, intCol, stringCol

apples = newTable(
    stringCol("Type", "Granny Smith", "Granny Smith", "Gala", "Gala", "Golden Delicious", "Golden Delicious"),
    stringCol("Color", "Green", "Green", "Red-Green", "Orange-Green", "Yellow", "Yellow"),
    intCol("WeightGrams", 102, 85, 79, 92, 78, 99),
    intCol("Calories", 53, 48, 51, 61, 46, 57)
)
```

## Group data with `by`

The [`by`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by) method groups columnar data into arrays. A list of grouping column names defines grouping keys. All rows from the input table with the same key values are grouped together.

If no input is supplied to [`by`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by), then there will be one group, which contains all of the data. The resultant table will contain a single row, where column data is grouped into a single array. This is shown in the example below:

```python
applesByNoColumn = apples.by()
```

If a single input is supplied to [`by`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by), then the resultant table will have row data grouped into arrays based on each unique value in the input column. This is shown in the example below:

```python
applesByType = apples.by("Type")
```

If more than one input is supplied to [`by`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by), then the resultant table will have row data grouped into arrays based on unique value pairs from the grouping columns. This is shown in the example below:

```python
applesByTypeAndColor = apples.by("Type", "Color")
```

![img](https://deephaven.io/core/docs/assets/how-to/applesBy-TypeAndColor.png)

Formulas supplied to [`by`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by) can also be used to both add new columns and group data. The example below simultaneously adds two new columns and groups on the columns. If you are unfamiliar with the ternary conditional statements used in the example, see [How to use the ternary conditional operator](ternary-if-how-to).

```python
applesByClassAndDiet = apples.by("Class = (WeightGrams < 90) ? `Light` : `Heavy`",
    "Diet = (Calories < 50) ? `Allowed` : `Not Allowed`")
```

## Ungroup data with `ungroup`

The [`ungroup`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup) method is the inverse of [`by`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by). It unwraps content from arrays and builds a new set of rows from it. The method takes optional columns as input. If no inputs are supplied, all array columns are unwrapped. If one or more columns are given as input, only those columns will have their array values unwrapped into new rows.

The example below shows how [`ungroup`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup) reverses the [`by`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by) operation used to create `applesByClassAndDiet` when no columns are given as input. Notice how all array columns have been unwrapped, leaving a single element in each row of the resultant table:

```python
newApples = applesByClassAndDiet.ungroup()
```

The example below uses [`ungroup`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup) to unwrap the `Color` column in `applesByClassAndDiet`. This unwraps only arrays in the `Color` column, and not the others. Notice how the `Type`, `WeightGrams`, and `Calories` columns still contain arrays:

```python
applesUngroupedByColor = applesByClassAndDiet.ungroup("Color")
```

## Different array types

The [`ungroup`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup) method can ungroup DbArrays and Java arrays.

The example below uses the [`emptyTable`](https://deephaven.io/core/docs/reference/table-operations/create/emptyTable) method to create a table with two columns and one row. Each column contains a Java array with 3 elements. The [`ungroup`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup) method works as expected on Java arrays.

```python
from deephaven.TableTools import emptyTable

t = emptyTable(1).update("X = new int[]{1, 2, 3}", "Z = new int[]{4, 5, 6}")
t_ungrouped = t.ungroup()
```

The example below uses [`ungroup`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup) to unwrap both a DbArray (column `X`) and a Java array (column `Z`) at the same time.

```python
from deephaven.TableTools import newTable, intCol

t = newTable(
    intCol("X", 1, 2, 3)
).by().update("Z = new int[]{4, 5, 6}")

t_ungrouped = t.ungroup()
```

## Different array lengths

The [`ungroup`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup) method cannot unpack a row that contains arrays of different length.

The example below uses the [`emptyTable`](https://deephaven.io/core/docs/reference/table-operations/create/emptyTable) method to create a table with two columns and one row. Each column contains a Java array, but one has three elements and the other has two. Calling [`ungroup`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup) without an input column will result in an error.

```python
from deephaven.TableTools import emptyTable

t = emptyTable(1).update("X = new int[]{1, 2, 3}", "Z = new int[]{4, 5}")
t_ungrouped = t.ungroup() # This results in an error
```

It is only possible to ungroup columns of the same length. Arrays of different lengths must be ungrouped separately.

```python
t_ungroupedByX = t.ungroup("X")
t_ungroupedByZ = t.ungroup("Z")
```

## Null values

Using [`by`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by) on a table with null values will work properly. Null values will appear as empty array elements when grouped with [`by`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by). Null array elements unwrapped using [`ungroup`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup) will appear as null (empty) row entries in the corresponding column.

The example below uses the [`emptyTable`](https://deephaven.io/core/docs/reference/table-operations/create/emptyTable) method and the [ternary operator](https://deephaven.io/core/docs/reference/query-language/control-flow/ternary-if) to create a table with two columns of 5 rows. The first and second rows contain null values. Null values behave as expected during grouping and ungrouping.

```python
from deephaven.TableTools import emptyTable
from deephaven.conversion_utils import NULL_INT

t = emptyTable(5).update("X = i", "Z = i < 2 ? NULL_INT : i-2")
t_by = t.by()
new_t = t_by.ungroup()
```

The example below uses the [`emptyTable`](https://deephaven.io/core/docs/reference/table-operations/create/emptyTable) method to create a table with one column and one row. The single cell in the table contains a null Java array. Calling [`ungroup`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup) on this table results in an empty table with one column.

```python
from deephaven.TableTools import emptyTable

t = emptyTable(1).update("X = (int[])(null)")
t_ungrouped = t.ungroup()
```

## Related documentation

- [Create a new table](https://deephaven.io/core/docs/reference/table-operations/create/new-table)
- [by](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/by)
- [emptyTable](https://deephaven.io/core/docs/reference/table-operations/create/emptyTable)
- [newTable](https://deephaven.io/core/docs/reference/table-operations/create/newTable)
- [ternary-if](https://deephaven.io/core/docs/reference/query-language/control-flow/ternary-if)
- [ungroup](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/ungroup)
