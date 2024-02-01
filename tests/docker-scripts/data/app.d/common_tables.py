from deephaven import new_table, empty_table, time_table
from deephaven.column import string_col, double_col

size = 20
scale = 999

simple_table = empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"])

column_groups = [{ 'name': 'YandZ', 'children': ['y', 'z'] }, { 'name': 'All', 'children': ['x', 'YandZ'], 'color': 'white' }]
simple_table_header_group = simple_table.layout_hints(column_groups=column_groups)
simple_table_header_group_hide = simple_table.layout_hints(column_groups=column_groups, hide=['y', 'z'])

double_and_string = new_table([
double_col("Doubles", [3.1, 5.45, -1.0, 1.0, 3.0, 4.20]),
string_col("Strings", ["Creating", "New", "Tables", "Tables", "New", "Creating"])
])

all_types = empty_table(size).update([
  "String=(i%11==0 ? null : `a` + (int)(scale*(i%2==0? i+1 : 1)))",
  "Int=(i%12==0 ? null : (int)(scale*(i*2-1)))",
  "Long=(i%13==0 ? null : (long)(scale*(i*2-1)))",
  "Float=(float)(i%14==0 ? null : i%10==0 ? 1.0F/0.0F: i%5==0 ? -1.0F/0.0F : (float) scale*(i*2-1))",
  "Double=(double)(i%16==0 ? null : i%10==0 ? 1.0D/0.0D: i%5==0 ? -1.0D/0.0D : (double) scale*(i*2-1))",
  "Bool = (i%17==0 ? null : (int)(i)%2==0)",
  "Char = (i%18==0 ? null : new Character((char) (((26+i*i)%26)+97)) )",
  "Short=(short)(i%19==0 ? null : (int)(scale*(i*2-1)))",
  "BigDec=(i%21==0 ? null : new java.math.BigDecimal(scale*(i*2-1)))",
  "BigInt=(i%22==0 ? null : new java.math.BigInteger(Integer.toString((int)(scale*(i*2-1)))))",
  "Byte=(Byte)(i%19==0 ? null : new Byte( Integer.toString((int)(i))))",
])
