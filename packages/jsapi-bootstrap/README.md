# @deephaven/jsapi-bootstrap

This is a library to bootstrap load the JS API. It provides functionality to load the API and set it in a context object, or to set it globally to retain legacy behaviour. Will display an error if unable to load the API.

## Install

```bash
npm install --save @deephaven/jsapi-bootstrap
```

## Usage

### Using Context

```javascript
import { ApiBootstrap, useApi } from '@deephaven/jsapi-bootstrap';

function MyComponent() {
  const api = useApi();

  ...
}

<ApiBootstrap apiUrl={API_URL}>
  <MyComponent />
</ApiBootstrap>;
```

### Using API globally (legacy behaviour)

If you're using the JSAPI shim or relying on the API to be set globally, you'll need to lazily load your component first so the API is set before imports attempt to use it.

```javascript
// App.tsx
import { ApiBootstrap } from '@deephaven/jsapi-bootstrap';

const MyComponent = React.lazy(() => import('./MyComponent'));

<ApiBootstrap apiUrl={API_URL} setGlobally>
    <Suspense fallback={<div>Loading...</div>}>
      <MyComponent />
    </Suspense>
</ApiBootstrap>;

// MyComponent.tsx
import dh from '@deephaven/jsapi-shim';
function MyComponent() {
  const client = new dh.CoreClient(...);

  ...
}
```
