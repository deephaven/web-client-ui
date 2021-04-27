# Deephaven Javascript Plugins

Javascript plugins allow a user to write arbitrary Javascript code and attach it to a Table.

## Creating a Plugin

1.  Start with default `Remote Component` setup from here: <br>
    https://github.com/Paciolan/remote-component#creating-remote-components

2.  Install Web Pack <br>
    https://webpack.js.org/guides/getting-started/ <br>

    ```
    npm install webpack webpack-cli --save-dev
    ```

3.  Install Babel <br>
    https://www.valentinog.com/blog/babel/ <br>

    ```
    npm i @babel/core babel-loader @babel/preset-env @babel/preset-react --save-dev
    ```

4.  Create `.babelrc` <br>

    ```
    {
    "presets": ["@babel/preset-env", "@babel/preset-react"]
    }
    ```

5.  Update `webpack.config.js` to look like this:

    ```
    module.exports = {
      output: {
        libraryTarget: "commonjs"
      },
      externals: {
        react: "react",
        reactstrap: "reactstrap",
      },
      module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader"
            }
          }
        ]
      }
    };
    ```

6.  Place your Javascript code in `index.js`

7.  Run Web Pack

```
/npx webpack --config webpack.config.js
```

Your output will be in `dist/main.js`

## Javascript Code for a Plugin

1.  Your plugin must be a React Component.

2.  The `table`, `user`, `client`, `panel`, `onFilter` method, and an `onFetchColumns` method are passed in as props.

```
const { table, onFilter, onFetchColumns } = this.props;
onFilter([
  {
    name: 'column name',
    type: 'column type',
    value: 'value to filter on',
  },
]),
// These columns will always be in the viewport
onFetchColumns(['A', 'B'])
```

3.  You may have an optional `getMenu(data)` method that will return an array of menu objects.

```
getMenu(data) {
  const { value } = data;
  const actions = [];

  actions.push({
    title: 'Display value',
    group: 0,
    order: 0,
    action: () => alert(value),
  });

  return actions
}
```

The `data` object contains the following:

```
{
  table,
  model,
  value,
  valueText,
  column,
  rowIndex,
  columnIndex,
  modelRow,
  modelColumn,
}
```

## Uploading a Plugin

1.  Create a directory on the Server to place the plugins.

2.  Set the config value for `Webapi.plugins` to point to the plugins directory.

3.  Copy the output file `main.js` to that directory on the server and rename it (e.g. `ExamplePlugin.js`).

4.  The file name is used as the name of the plugin. <br>
    e.g. `ExamplePlugin.js` will be named `ExamplePlugin`

## Attach a Plugin in a Query

Simply set the PLUGIN_NAME attribute on the Table with the name of the plugin <br>
For a plugin located at https://host/url/iriside/plugins/ExamplePlugin.js <br>
The name will ExamplePlugin

```
t=TableTools.emptyTable(100).updateView("MyColumn=`MyValue`")
t.setAttribute("PluginName", "ExamplePlugin")
```
