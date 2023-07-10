# @deephaven/auth-plugins

Authentication plugins for Deephaven. Used by [AuthBootstrap](../app-utils/src/components/AuthBootstrap.tsx) to provide default authentication if no custom plugins are loaded. For mode details on custom plugins, see [deephaven-js-plugins repository](https://github.com/deephaven/deephaven-js-plugins).

## Install

```bash
npm install --save @deephaven/auth-plugins
```

## Developing New Auth Plugins

Export an `AuthPlugin` from a module to register an authentication plugin. Authentication plugins must implement the [AuthPlugin interface](./src/AuthPlugin.ts#L32). Authentication plugins can display a UI which then triggers how to login.

The Web UI loads all plugins on initialization, and uses the first available authentication plugin for authenticating. A sequence diagram of this flow at a high level, where `AuthPlugin` is the first authentication plugin that is available.

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web UI
  participant S as Server
  participant P as AuthPlugin
  participant J as JS API
  U->>W: Open app
  W->>S: Load plugin modules
  S-->>W: PluginModule[]
  W->>P: Login
  P->>J: client.login()
  J-->>P: Login success
  P-->>W: Login success
```

## Examples

Below are some sequence diagrams for some of the included Auth Plugins.

#### Pre-shared Key ([AuthPluginPsk](./src/AuthPluginPsk.tsx))

```mermaid
sequenceDiagram
  participant W as Web UI
  participant P as AuthPluginPsk
  participant J as JS API
  W->>P: Login
  alt Key in query string
    P->>J: client.login(key)
  else Prompt user for key
    P->>P: Prompt for key
    P->>J: client.login(key)
  end
  J-->>P: Login success
  P-->>W: Login success
```

### Composite Password/Anonymous plugin

Composite plugin giving the user the choice of logging in with a password or logging in anonymously

```mermaid
sequenceDiagram
  participant W as Web UI
  participant CP as CompositePlugin
  participant AP as AnonymousPlugin
  participant PP as PasswordPlugin
  participant J as JS API
  W->>CP: Login
  CP->>CP: Prompt for authentication method
  activate CP
    alt Password login
      activate PP
        loop Until success
          PP->>PP: Show Login UI
          PP->>J: client.login(password)
          alt Login success
            J-->>PP: Login success
          else Login failure
            J-->>PP: Login failure
            PP->>PP: Show login error
          end
        end
        PP-->>CP: Login success
      deactivate PP
    else Anonymous login
      activate AP
        AP->>J: client.login(anonymous)
        J-->>AP: Login success
        AP-->>CP: Login success
      deactivate AP
    end
    CP-->>W: Login success
  deactivate CP
```

#### Auth0

Translation of flow from https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow, showing which responsibilities login plugin handles. Note that the plugins need to be loaded initially prior to redirecting to the authorization prompt, and then again after redirecting back to the Web UI. For a specific example using Keycloak, see [AuthPluginKeycloak](https://github.com/deephaven/deephaven-js-plugins/tree/main/plugins/auth-keycloak).

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web UI
  participant S as Server
  participant P as Auth0Plugin
  participant T as Auth0 Tenant
  participant J as JS API
  U->>W: Open app
  W->>S: Load plugin modules
  S-->>W: PluginModule[]
  W->>P: Login
  P->>T: Authorization code request to /authorize
  T->>U: Redirect to login/authorization prompt
  U-->>T: Authenticate and Consent
  T->>W: Authorization code
  W->>S: Load plugin modules
  S-->>W: PluginModule[]
  W->>P: Login
  P->>T: Authorization Code + Client ID + Client Secret to /oauth/token
  T->>T: Validate Authorization Code + Client ID + Client Secret
  T-->>P: ID Token and Access Token
  P->>J: client.login(token)
  J-->>P: Login success
  P-->>W: Login success
```

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](../../LICENSE) file.
