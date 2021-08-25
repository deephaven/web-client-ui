# Filters

This guide discusses how to properly use filters to exclude unwanted data from analysis in Deephaven. Topics covered include match and conditional filtering, conjunctive and disjunctive filtering, and filtering with `head` and `tail`.

To illustrate filtering in Deephaven, we'll use the Iris data set from the examples. This data set contains observations about Iris flowers from R. A. Fisher's classic 1936 paper, "The Use of Multiple Measurements in Taxonomic Problems". The paper describes categorizing plant varieties by using observable metrics. The data is often used to demonstrate machine learning categorization algorithms.

```python
from deephaven.TableTools import readCsv

iris = readCsv("/data/examples/iris/csv/iris.csv")
```

This produces the `iris` table, which has five columns and 150 rows. The first four columns contain Iris measurement data, while the fifth column, `Class`, is the Iris species name.

## Match filters

Match filters use `where` to filter out unwanted data. They come in six different flavors:

- equals (= and ==)
- in
- not in
- icase in
- icase not in

### equals (`=` and `==`)

This method returns rows that have a matching value in a specified column. In the example below, the new table `filteredBySepalWidth` contains only the rows from the `iris` table with a 3.5 cm sepal width.

```python
filteredBySepalWidth = iris.where("SepalWidthCM = 3.5")
```

**Note**: The single equals (`=`) and double equals (`==`) can be used interchangeably in filters.

### `in`

This method returns rows that contain a match of one or more values in a specified column. In the example below, the new table `filteredByClass` contains only Iris setosa and virginica flowers.

```python
setosaAndVirginica = iris.where("Class in `Iris-setosa`, `Iris-virginica`")
```

### `not in`

This method returns rows that do **not** contain a match of one or more values in a specified column. In the example below, the new table `versicolor` contains only Iris versicolor flowers.

```python
notSetosaOrVirginica = iris.where("Class not in `Iris-setosa`, `Iris-virginica`")
```

### `icase in`

This method returns rows that contain a match of one or more values in a specified column, regardless of capitalization. In the example below, the new table `virginica` contains only Iris virginica flowers.

```python
virginica = iris.where("Class icase in `iris-virginica`")
```

### `icase not in`

This method returns rows that do **not** contain a match of one or more values in a specified column, regardless of capitalization. In the example below, the new table `notVersicolor` contains data for Iris setosa and viriginca flowers.

```python
notVersicolor = iris.where("Class icase not in `iris-versicolor`")
```

## Conditional filters

Like match filters, conditional filters use `where` to filter out unwanted data. Conditional filters are used to filter data based on formulas other than those provided by match filters. These can be an arbitrary boolean formula.

Conditional filters frequently use:

- `=` and `==`: is equal to
- `!=`: is not equal to
- `>` and `<`: greater than and less than
- `>=` and `<=`: greater than or equal to and less than or equal to
- Methods on strings (e.g. [`startsWith`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#startsWith-java.lang.String-), [`endsWith`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#endsWith-java.lang.String-), [`matches`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#matches-java.lang.String-), [`contains`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#contains-java.lang.CharSequence-))

### Equality and inequality filtering

While filtering for equality is an example of match filtering, it becomes a conditional filter when adding other operations. In the example below, the equality filter becomes conditional when it checks the result of a modulo operation. The filter returns a table containing Iris flower data with petal width that is a multiple of 0.5 cm.

```python
conditionalEqualityFiltered = iris.where("PetalWidthCM % 0.5 == 0")
```

### Range filtering

It's common to filter for data that falls with a range of values. Using one or more of `>`, `<`, `>=`, `<=`, and `inRange` is the best way to achieve this.

In the example below, `<` is used to filter by sepal width in a range. Then, `inRange` is used to filter by petal width in a range.

```python
sepalWidthLessThanThreeCM = iris.where("SepalWidthCM < 3.0")
petalWidthOneCMorLess = iris.where("inRange(PetalWidthCM, 0, 1)")
```

### String filtering

Methods on objects can be used to filter. Strings in Deephaven are represented as Java strings. Any methods on [`java.lang.String`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html) can be called from within a query string. Methods such as [`startsWith`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#startsWith-java.lang.String-), [`endsWith`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#endsWith-java.lang.String-), [`contains`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#contains-java.lang.CharSequence-), and [`matches`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#matches-java.lang.String-) can be useful for performing partial string matches.

In the two examples below, each operator is used to filter Iris data based on substring matches. [`startsWith`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#startsWith-java.lang.String-) searches for a prefix, [`endsWith`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#endsWith-java.lang.String-) searches for a suffix, [`contains`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#contains-java.lang.CharSequence-) searches for a substring, and [`matches`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#matches-java.lang.String-) searches for a regular expression match.

```python
newIris = iris.where("Class.startsWith(`Iris`)")
setosa = iris.where("Class.endsWith(`setosa`)")
```

```python
containsVersicolor = iris.where("Class.contains(`versicolor`)")
matchesVersicolor = iris.where("Class.matches(`.*versicolor.*`)")
```

## Combine filters

Multiple match and/or conditional statements can be combined to filter data in a table. These combinations can be either conjunctive or disjunctive.

### Conjunctive filtering (AND)

Conjunctive filtering is used to return a table where **all** conditional filters in a `where` clause return true.

In the following example, a conjunctive filter is applied to the `iris` table to produce a new table of only Iris setosa flowers with a petal length in a specific range.

```python
conjunctiveFilteredIris = iris.where("Class in `Iris-setosa`", "PetalLengthCM >= 1.3 && PetalLengthCM <= 1.6")
```

### Disjunctive filtering (OR)

Disjunctive filtering is used to return a table where **one or more** of the statements return true. This can be achieved by either using the logical OR operator (`||`) or using `whereOneOf`.

In the following example, two filters work disjunctively to return a new table where the petal length is greater than 1.9 cm or less than 1.3 cm.

```python
orFilteredIris = iris.where("PetalLengthCM > 1.9 || PetalWidthCM < 1.3")
whereOneOfFilteredIris = iris.whereOneOf("PetalLengthCM > 1.9", "PetalWidthCM < 1.3")
```
