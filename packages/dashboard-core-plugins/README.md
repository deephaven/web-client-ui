# @deephaven/dashboard-core-plugins

Core Deephaven plugins for use with @deephaven/dashboard. Provides grids, charts, input filter, and linker functionality.

## Install

```bash
npm install --save @deephaven/dashboard-core-plugins
```

## Usage

```jsx
import React, { Component } from 'react';
import Dashboard from '@deephaven/dashboard';
import DashboardCorePlugin from '@deephaven/dashboard-core-plugins';

class Example extends Component {
  render() {
    return (
      <Dashboard>
        <DashboardCorePlugin />
      </Dashboard>
    );
  }
}
```

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](../../LICENSE) file.
