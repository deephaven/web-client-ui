from deephaven import empty_table, time_table

size = 20
scale = 999

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