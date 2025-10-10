from deephaven import dtypes as dht
from deephaven import empty_table
from deephaven.stream import blink_to_append_only
from deephaven.stream.table_publisher import table_publisher

def create_append_only_table():
    _my_blink_table, my_publisher = table_publisher(
        "My blink table",
        {"x": dht.string, "y": dht.int32},
    )

    my_publisher.add(
        empty_table(50).update(["x=`Start`", "y=i"])
    )

    def add_more_rows_to_table():
        my_publisher.add(
            empty_table(50).update(["x=`End`", "y=50+i"])
        )

    append_only_table = blink_to_append_only(_my_blink_table)
    return append_only_table, add_more_rows_to_table


