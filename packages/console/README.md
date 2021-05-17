# @deephaven/console

This is a library of Deephaven Console component. Display a REPL console connected to a Deephaven session.

## Usage

Add the package to your "dependencies":
```
npm install --save @deephaven/console
```

Then, import and use the component from the package:
```
import { Console } from '@deephaven/console';

// In your render function
<Console session={session} />
```