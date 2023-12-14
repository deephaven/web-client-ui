# Embedded Deephaven Chart

This project uses [Vite](https://vitejs.dev/guide/). It is to provide an example React application connecting to Deephaven and displaying a chart or plot.

## Running

To start the Embed Chart server, run `npm install` and `npm start` in the root directory of this repository. See the [Getting Started](../../README.md#getting-started) section for more details.

## Query Parameters

- `name`: Required. The name of the chart to load

## Advanced

### Application Mode

See the guide for how to set up core in Application Mode: https://deephaven.io/core/docs/how-to-guides/application-mode/

Once Deephaven is running, you can open a chart with a specific name by adding the query param `name`, e.g. http://localhost:4020/?name=world

### Configuring Server Address

By default, this project assumes you are hosting Deephaven with Python on the default port at http://localhost:10000. If Deephaven is running on a different port/server, update the `VITE_CORE_API_URL` environment variable to point to the correct server. See [.env](./.env) file for the default definition, and [vite docs](https://vitejs.dev/guide/env-and-mode.html#env-variables-and-modes) for other ways to set this environment variable.
