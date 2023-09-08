# `@deephaven/eslint-config`

The eslint configuration settings used by Deephaven Data Labs.

## Usage

Install dependencies:
```
npm install --save-dev eslint @deephaven/eslint-config
```

Also install all peer dependencies.

In your package.json, add a `eslintConfig` configuration:
```
"eslintConfig": { "extends": "@deephaven/eslint-config" }
```

## Deephaven Eslint Plugin (eslint-plugin-deephaven)
The `deephaven` eslint plugin is defined inside of the `plugin` folder. There is
a `devDependency` mapping in `package.json` which allows it to be consumed in an
eslint config file using the name `deephaven`.

```json
"devDependencies": {
  "eslint-plugin-deephaven": "file:./plugin"
},
```

e.g.
```javascript
module.exports = {
  root: true,
  plugins: ['deephaven'],
}
```

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](../../LICENSE) file.
