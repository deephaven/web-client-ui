# Deephaven JavaScript Module Plugin Template

Use this Template to create a JavaScript Plugin. It is set up with TypeScript, React, ESLint, Prettier, sass, and image loader. Use this template as a starting point for creating new Deephaven JavaScript Module Plugins. Each JavaScript module may or may not include different plugin types, such as a `DashboardPlugin` or a `TablePlugin`.

## Initial Setup

After checking out this template for the first time:

1. Do an `npm install`

## Source Files

Your main source file is `src/index.ts`. It imports exports

It imports the

## Build the Plugin

```
npm run build
```

Your output will be in `dist/index.js`

## Usage

Set the `PLUGIN_NAME` attribute on the Table with the name of the plugin.

```
t = emptyTable(5).update("X=i")
t.setAttribute("PluginName", "@deephaven/js-plugin-table-example")
```

The table will then open up, with the "Example Plugin" shown across the top, and options in the context menu.
