# @deephaven/file-explorer

React component for browsing a file explorer server. Has a WebDAV implementation included.

## Install

```bash
npm install --save @deephaven/file-explorer
```

## Usage

## Usage

```jsx
import React, { Component } from 'react'
import FileExplorer, { WebdavFileStorage } from '@deephaven/file-explorer'

const client = createClient('https://www.example.com/');
const storage = new WebdavFileStorage(client);

class Example extends Component {
  render() {
    return <FileExplorer storage={storage} onSelect={item => console.log('Item selected', item)} />
  }
}
```

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](../../LICENSE) file.
