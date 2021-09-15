# @deephaven/dashboard

React component for displaying a Deephaven dashboard. Register plugins to display components.

## Install

```bash
npm install --save @deephaven/dashboard
```

## Usage

```jsx
import React, { Component } from 'react';
import Dashboard from '@deephaven/dashboard';
import MyDashboardPlugin from './MyDashboardPlugin';

class Example extends Component {
  render() {
    return (
      <Dashboard>
        <MyDashboardPlugin />
      </Dashboard>
    );
  }
}
```

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](../../LICENSE) file.
