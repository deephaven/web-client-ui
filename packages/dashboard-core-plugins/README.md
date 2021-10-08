# @deephaven/dashboard-core-plugins

Core Deephaven plugins for use in dashboards

## Install

```bash
npm install --save @deephaven/dashboard-core-plugins
```

## Usage

```jsx
import React, { Component } from 'react';
import Dashboard from '@deephaven/dashboard';
import { GridPlugin, ChartPlugin } from '@deephaven/dashboard';
import MyDashboardPlugin from './MyDashboardPlugin';

class Example extends Component {
  render() {
    return (
      <Dashboard>
        <GridPlugin />
        <ChartPlugin />
        <MyDashboardPlugin />
      </Dashboard>
    );
  }
}
```

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](../../LICENSE) file.
