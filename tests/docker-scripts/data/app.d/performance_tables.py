from deephaven import empty_table

# Tables used only by the grid performance benchmarks in tests/grid-perf.
# They are large and lazily evaluated with update_view so cells are only
# materialized as the viewport fetches them.

perf_row_count = 1_000_000

perf_scale = 999

perf_all_types_cols = [
    "String=(i%11==0 ? null : `a` + (int)(perf_scale*(i%2==0? i+1 : 1)))",
    "Int=(i%12==0 ? null : (int)(perf_scale*(i*2-1)))",
    "Long=(i%13==0 ? null : (long)(perf_scale*(i*2-1)))",
    "Float=(float)(i%14==0 ? null : i%10==0 ? 1.0F/0.0F: i%5==0 ? -1.0F/0.0F : (float) perf_scale*(i*2-1))",
    "Double=(double)(i%16==0 ? null : i%10==0 ? 1.0D/0.0D: i%5==0 ? -1.0D/0.0D : (double) perf_scale*(i*2-1))",
    "Bool = (i%17==0 ? null : (int)(i)%2==0)",
    "Char = (i%18==0 ? null : new Character((char) (((26+i*i)%26)+97)) )",
    "Short=(short)(i%19==0 ? null : (int)(perf_scale*(i*2-1)))",
    "BigDec=(i%21==0 ? null : new java.math.BigDecimal(perf_scale*(i*2-1)))",
    "BigInt=(i%22==0 ? null : new java.math.BigInteger(Integer.toString((int)(perf_scale*(i*2-1)))))",
    "Byte=(Byte)(i%19==0 ? null : new Byte( Integer.toString((int)(i % 128))))",
]

perf_all_types_big = empty_table(perf_row_count).update_view(perf_all_types_cols)

# 123 characters
perf_lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. "

# ~500 characters, already far wider than any column can render
perf_long_text = perf_lorem * 4

# ~25,000 characters, where a single cell is more text than the whole grid
perf_huge_text = perf_lorem * 200

perf_min_variable_length = 24

# Filler columns exist only to make the tables wider than the viewport. Every
# cell is longer than the max column width, so each one is auto sized to 600px
# and the table ends up ~18,000px wide.
perf_filler_column_count = 30

perf_filler_cols = [
    f"Filler{i} = perf_lorem + i" for i in range(perf_filler_column_count)
]


def _long_string_cols(text_name):
    # `Repeated` hits the text width cache on every row, `Unique` and `Variable`
    # miss it, and `Variable` also varies the truncation point row to row
    return [
        "Index = i",
        "Short = `Row ` + i",
        f"Repeated = {text_name}",
        f"Unique = {text_name} + i",
        f"Variable = {text_name}.substring(0, {perf_min_variable_length} + (i % ({text_name}.length() - {perf_min_variable_length})))",
    ] + perf_filler_cols


perf_long_strings = empty_table(perf_row_count).update_view(
    _long_string_cols("perf_long_text")
)

perf_huge_strings = empty_table(perf_row_count).update_view(
    _long_string_cols("perf_huge_text")
)
