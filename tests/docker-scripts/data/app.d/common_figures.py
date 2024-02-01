from deephaven import empty_table
from deephaven.plot.figure import Figure
import math

simple_plot = Figure().plot_xy(series_name="Test", t=empty_table(100).update(["x=i", "y=Math.sin(i)", "z=Math.cos(i)"]), x="x", y="y").show()


math_funcs = ["sin", "cos"]
shapes = ["SQUARE", "CIRCLE", "UP_TRIANGLE", "DOWN_TRIANGLE", "RIGHT_TRIANGLE", "LEFT_TRIANGLE", "DIAMOND"]
# Unsupported shapes: ["ELLIPSE", "HORIZONTAL_RECTANGLE", "VERTICAL_RECTANGLE"]

# Create a generic table that has enough columns to display all the shapes
# Re-uses some of the funcs
trig_table = empty_table(50).update(["x=i*0.1"])
for i in range(len(shapes)):
    trig_table = trig_table.update([f"y{i}=Math.{math_funcs[i % len(math_funcs)]}(x+{math.floor(i / len(math_funcs))})"])

# Generate the table and figure based on the shapes created
trig_figure = Figure()
for i in range(len(shapes)):
    trig_figure = trig_figure.plot_xy(series_name=shapes[i], t=trig_table, x="x", y=f"y{i}").point(shape=shapes[i], size=len(shapes) - i, visible=True)

trig_figure = trig_figure.show();
