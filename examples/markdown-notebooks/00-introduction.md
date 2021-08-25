# Introduction

This is a markdown notebook. You can double-click anywhere to start editing it.
Add code blocks like you would in markdown (eg. '\`\`\`python') to add executable cells.
Then click on them to select them, and press the Play button to advance to the next cell.

This example notebook gets you started with Deephaven.

## Printing to stdout

Printing to stdout is easy. Just do it like you would normally in python.

```python
print('Hello world')
```

## Create a table with newTable

Here, we will make a simple two-column table.

```python
from deephaven.TableTools import newTable, stringCol, intCol

result = newTable(
    stringCol("NameOfStringCol", "Data String 1", 'Data String 2', "Data String 3"),
    intCol("NameOfIntCol", 4, 5, 6)
 )
```

## Create a table with emptyTable

Here, we will use the emptyTable method to create a table with five rows and zero columns.
The sole argument is the number of rows to be included in the new table.

```python
from deephaven.TableTools import emptyTable

empty = emptyTable(5)
```

In the following query, we add a new column (X), which contains the same integer value (5) in each row.

```python
result = empty.update("X = 5")
```

In the following query, we create a new column (X), which contains the values from array a. The [special variable i](https://deephaven.io/core/docs/reference/query-language/variables/special-variables) is the row index.

```python
a = [1, 2, 3, 4, 10]

result2 = empty.update("X = a[i]")
```

## Create a table with timeTable

Here, we will make a simple time table that ticks every two seconds. We are using the [timeTable](https://deephaven.io/core/docs/reference/table-operations/create/timeTable/) method. Its sole argument specifies the interval at which the table ticks.

```python
from deephaven.TableTools import timeTable

result = timeTable('00:00:02')
```

## Simple Python query

In Python, the first step is to import all the tools your query will need. In this example, we are going to make a new table with columns that are strings, integers, doubles. We use the following import command:

```python
from deephaven.TableTools import newTable, stringCol, intCol, doubleCol
```

We will draw from sample data that analyzes the average temperature and precipitation of rain each month for Miami, Florida. [Click here for the original data set](https://www.usclimatedata.com/climate/miami/florida/united-states/usfl0316).

```python
miami = newTable(
    stringCol("Month","Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"),
    intCol("Temp", 60, 62, 65, 68, 73, 76, 77, 77, 76, 74, 68, 63),
    doubleCol("Rain", 1.62, 2.25, 3.00, 3.14, 5.34, 9.67, 6.50, 8.88, 9.86, 6.33, 3.27, 2.04)
)
```

We can now filter the data. For example, we only want to visit when the temperature is less than 74 degrees. To see which Months match that filter, enter the command below.

```python
visit = miami.where("Temp < 74")
```

We can also perform analysis on data, such as mathematical operations or formulas. In this example, we want to know how much each month's rainfall compares to the yearly average. The average yearly rainfall for Miami is 61.9 inches.

```python
rain = miami.update("RelativeRain = Rain - 61.9/12 ")
```
