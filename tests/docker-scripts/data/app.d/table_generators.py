from deephaven import empty_table, function_generated_table
from deephaven.execution_context import get_exec_ctx

# Creates a table that can be shrunk and grown in size
def create_shrink_grow_table():
    ctx = get_exec_ctx()
    i = 50

    def make_table():
        return empty_table(i).update(["X = i"])

    def shrink_table():
        nonlocal i
        i = 30;

    def grow_table():
        nonlocal i
        i = 70;

    table = function_generated_table(
        table_generator=make_table,
        refresh_interval_ms=1000,
        exec_ctx=ctx
    )

    return table, shrink_table, grow_table
