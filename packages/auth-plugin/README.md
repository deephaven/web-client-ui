# @deephaven/auth-plugin

A library for using types related to AuthPlugins. Authentication plugins are used to provide custom authentication to the Web UI, and can log the user in using [custom authentication handlers](https://github.com/deephaven/deephaven-core/tree/main/authentication) in `deephaven-core`.

## Install

```bash
npm install --save @deephaven/auth-plugin
```

## Usage

To create your own authentication plugin, you must build and export your own module. You can start with the [deephaven-js-plugin-template](https://github.com/deephaven/deephaven-js-plugin-template/) to get started, and export an `AuthPlugin` property conforming to the `AuthPlugin` interface. In your `AuthPlugin`, you must specify a `Component` which will display when the plugin is loaded, and the `isAvailable` method for specifying whether the plugin is available given the current server configuration. Login plugins installed on the server will take priority in the order specified, falling back to the [core plugins](../auth-core-plugins/) if none of the login plugins are available for the current server configuration. If you wish to create your own plugin that _always_ takes priority, just return `true` from your `isAvailable` method.

For an example of a basic authentication plugin, take a look at [AuthPluginAnonymous](../auth-core-plugins/src/AuthPluginAnonymous.tsx) which just displays a loading spinner and tries to login anonymously. You can display your own UI instead of a loading spinner with input fields and then attempt to login.

## Example

For more complex examples, take a look in [auth-core-plugins](../auth-core-plugins/src).

```typescript
import React, { useEffect } from 'react';
import { AuthPlugin, AuthPluginProps } from '@deephaven/auth-plugin';
import { LoadingOverlay } from '@deephaven/components';

const MyAuthPlugin: AuthPlugin = {
  /**
   * Define the component you would like to render here.
   * Could be a loading spinner, or an input form if you need the user to enter information
   */
  Component: ({
    client,
    onSuccess,
    onFailure,
  }: AuthPluginProps): JSX.Element => {
    useEffect(() => {
      let isCancelled = false;
      async function login() {
        try {
          // ...
          // Get login options here...
          // ...
          await client.login(loginOptions);
          if (!isCancelled) {
            onSuccess();
          }
        } catch (e) {
          if (!isCancelled) {
            onFailure(e);
          }
        }
      }
      login();
      return () => {
        isCancelled = true;
      };
    }, [client, onSuccess, onFailure]);

    // Show the login screen, or just a loading overlay if no user input is required
    return <LoadingOverlay />;
  },

  /**
   * Specify when this plugin is available.
   * Can just return `true` to always use this plugin.
   */
  isAvailable: (client, authHandlers, authConfigValues) => true,
};

export default MyAuthPlugin;
```
