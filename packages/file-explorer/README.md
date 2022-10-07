# @deephaven/file-explorer

React component for browsing a file explorer server. Implementation must be provided.

## Install

```bash
npm install --save @deephaven/file-explorer
```

## Usage

```jsx
import React, { Component } from 'react';
import FileExplorer, { FileStorage } from '@deephaven/file-explorer';

class MyFileStorage implements FileStorage {
  // Must implement all menthods...
}

const storage = new MyFileStorage();

class Example extends Component {
  render() {
    return (
      <FileExplorer
        storage={storage}
        onSelect={item => console.log('Item selected', item)}
      />
    );
  }
}
```

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](../../LICENSE) file.
