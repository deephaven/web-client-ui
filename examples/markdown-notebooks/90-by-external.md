# How to partition a table into subtables

This guide will show you how to use [`byExternal`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/byExternal) to partition tables into subtables by key columns.

Subtables are useful for:

- Parallelizing queries across multiple threads
- Quickly retrieving subtables in a user interface
- Improving the performance of filters iteratively called within loops

> **Note**: Subtable partitioning via [`byExternal`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/byExternal) should not be confused with [grouping and aggregation](https://deephaven.io/core/docs/how-to-guides/dedicated-aggregations), which is used to compute statistics over subsets of data.

## Create subtables from a source table

Subtables are created by calling [`byExternal`](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/byExternal) with a list of key columns. All rows from the input table with the same key values are grouped together into a subtable. The resulting subtables are stored in a [`TableMap`](https://deephaven.io/core/javadoc/io/deephaven/db/v2/TableMap.html).

```python
tableMap = sourceTable.byExternal(columns...)
```

## Retrieve a subtable from a `TableMap`

The [`get`](<https://deephaven.io/core/javadoc/io/deephaven/db/v2/TableMap.html#get(java.lang.Object)>) method on the [`TableMap`](https://deephaven.io/core/javadoc/io/deephaven/db/v2/TableMap.html) is used to retrieve a subtable. If the table was partitioned using one key column, values from the key column are used as keys to retrieve subtables. If the table was partitioned using multiple key columns, a [`SmartKey`](https://deephaven.io/core/pydoc/code/deephaven.TableManipulation.html?highlight=smartkey#deephaven.TableManipulation.SmartKey) must be used to retrieve a subtable.

```python
subTable = tableMap.get(key)
```

## Identify keys in a `TableMap`

The [`getKeySet`](<https://deephaven.io/core/javadoc/io/deephaven/db/v2/TableMap.html#getKeySet()>) method on the [`TableMap`](https://deephaven.io/core/javadoc/io/deephaven/db/v2/TableMap.html) provides all of the current keys in the [`TableMap`](https://deephaven.io/core/javadoc/io/deephaven/db/v2/TableMap.html). If the source table is dynamic, the key set will change as data is added or removed from the table.

```python
keySet = tableMap.getKeySet()

for key in keySet:
    print(key)
```

## Examples

The examples in this guide use a table called `houses` that contains data on several fictitious homes. It is created using [`newTable`](https://deephaven.io/core/docs/reference/table-operations/create/newTable).

```python
from deephaven.TableTools import newTable, intCol, stringCol, doubleCol

houses = newTable(
    stringCol("HomeType", "Colonial", "Contemporary", "Contemporary", "Condo", "Colonial", "Apartment"),
    intCol("HouseNumber", 1, 3, 4, 15, 4, 9),
    stringCol("StreetName", "Test Drive", "Test Drive", "Test Drive", "Deephaven Road", "Community Circle", "Community Circle"),
    intCol("SquareFeet", 2251, 1914, 4266, 1280, 3433, 981),
    intCol("Price", 450000, 400000, 1250000, 300000, 600000, 275000),
    doubleCol("LotSizeAcres", 0.41, 0.26, 1.88, 0.11, 0.95, 0.10)
)
```

### Partition a table using one column

The example below partitions the `houses` table into subtables by `HomeType`. Printing the keys shows that there is one key for each unique value in the `HomeType` column. Using [`get`](<https://deephaven.io/core/javadoc/io/deephaven/db/v2/TableMap.html#get(java.lang.Object)>) to retrieve the `Colonial` subtable results in the `colonialHomes` table, which contains only Colonial style homes from the `houses` table.

```python
housesByType = houses.byExternal("HomeType")

houseTypeKeys = housesByType.getKeySet()

for key in houseTypeKeys:
    print(key)

colonialHomes = housesByType.get("Colonial")
```

### Partition a table using more than one column

The example below partitions the `houses` table into subtables by `HomeType` and `StreetName`. Printing the keys shows that there is one key for each unique pair of values in the `HomeType` and `StreetName` columns. Because the partitioning is done on multiple tables, a [`SmartKey`](https://deephaven.io/core/pydoc/code/deephaven.TableManipulation.html?highlight=smartkey#deephaven.TableManipulation.SmartKey) is needed to retrieve the subtables when using [`get`](<https://deephaven.io/core/javadoc/io/deephaven/db/v2/TableMap.html#get(java.lang.Object)>).

```python
from deephaven import SmartKey

housesByStreetAndType = houses.byExternal("StreetName", "HomeType")

streetAndTypeKeys = housesByStreetAndType.getKeySet()

for key in streetAndTypeKeys:
    print(key)

testContempKey = SmartKey("Test Drive", "Contemporary")
contemporaryHomesOnTestDrive = housesByStreetAndType.get(testContempKey)

commColonialKey = SmartKey("Community Circle", "Colonial")
colonialHomesOnCommunityCircle = housesByStreetAndType.get(commColonialKey)
```

## Related documentation

- [Create a new table](https://deephaven.io/core/docs/how-to-guides/new-table)
- [byExternal](https://deephaven.io/core/docs/reference/table-operations/group-and-aggregate/byExternal)
- [SmartKey Javadoc](https://deephaven.io/core/javadoc/io/deephaven/datastructures/util/SmartKey.html)
- [SmartKey Pydoc](https://deephaven.io/core/pydoc/code/deephaven.TableManipulation.html?highlight=smartkey#deephaven.TableManipulation.SmartKey)
- [TableMap Javadoc](https://deephaven.io/core/javadoc/io/deephaven/db/v2/TableMap.html)
