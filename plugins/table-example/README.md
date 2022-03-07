# Deephaven JavaScript Table Example Plugin

A simple plugin demonstrating TablePlugin functionality.

## Development

```
npm install
npm run build
```

Your output will be in `dist/index.js`

## Usage

Set the `PLUGIN_NAME` attribute on the Table with the name of the plugin.

```
from deephaven.TableTools import emptyTable
t = emptyTable(5).update("X=i")
t.setAttribute("PluginName", "@deephaven/js-plugin-table-example")
```

The table will then open up, with the "Example Plugin" shown across the top, and options in the context menu.
