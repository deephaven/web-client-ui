# Plugin modules

This folder contains internally developed JS Plugin modules. Each plugin should be the following:

- Based off the [JS Module Plugin template](https://github.com/deephaven/deephaven-js-plugin-template/)
- Package name `@deephaven/js-plugin-<folderName>`
- Independent versioning, `npm install`, `npm run build`

## Development

For developing a new plugin, currently the easiest way to test it is to copy it into the `js-plugins` folder on the server. For example, to start developing with the `matplotlib` plugin:

```
cd matplotlib
npm install
npm run start
```

Then, whenever you make changes, after it has finished re-compiling, copy the compiled build out to the server:

```
docker cp dist/. core-web-1:/usr/share/nginx/html/js-plugins/@deephaven/js-plugin-matplotlib/dist/
```
