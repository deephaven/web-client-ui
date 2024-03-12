# @deephaven/components

This is a component library of Deephaven React components. See [./src/index.ts](./src/index.ts) for a list of components that can be imported into your package.

## Usage

Add the package to your "dependencies":

```
npm install --save @deephaven/components
```

Then, import and use the components from the package:

```
import React from "react";
import ReactDOM from "react-dom";
import { Button, ThemeProvider } from "@deephaven/components";
import "@deephaven/components/scss/BaseStyleSheet.scss";

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider themes={[]}>
      <Button kind="primary">Hello</Button>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

```
