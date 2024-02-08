from deephaven import new_table
from deephaven.column import bool_col, char_col, datetime_col, double_col, string_col
from deephaven.time import to_j_instant

multiselect_null = new_table([string_col("MultiselectTestData", [None])])

multiselect_empty = new_table([string_col("MultiselectTestData", [""])])

multiselect_bool = new_table([bool_col("MultiselectTestData", [True])])


t1 = to_j_instant("2021-06-02T08:00:02 ET")
t2 = to_j_instant("2021-06-03T08:00:03 ET")
t3 = to_j_instant("2021-06-04T08:00:04 ET")
t4 = to_j_instant("2021-06-01T08:00:01 ET")
multiselect_datetime = new_table(
    [datetime_col("MultiselectTestData", [t1, t2, None, t3, t4])]
)

multiselect_char = new_table([char_col("MultiselectTestData", [97, 98, 99, 100, 101])])

multiselect_number = new_table(
    [double_col("MultiselectTestData", [1, 2, None, 3, 4, 0, -1.1, 1.1])]
)

multiselect_string = new_table(
    [
        string_col(
            "MultiselectTestData",
            [
                "A",
                "ABA",
                None,
                "ABABA",
                "AA",
                "ABAA",
                "AABA",
                "a",
                "aba",
                "ababa",
                "aa",
                "abaa",
                "aaba",
            ],
        )
    ]
)
