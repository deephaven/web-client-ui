# @deephaven/component-template

This is an example which is setup to build components using Typescript, React, and Sass with Jest for testing and Storybook for isolated component development. Plain Javascript is also allowed, but for new components Typescript is preferred.

## Usage

1. Copy this folder into a new folder within the `packages` directory.
1. Open `package.json` in your new directory and give your package a new name. Lerna will ignore any packages with the name `@deephaven/component-template`
1. In the root of all the packages, run `npm bootstrap`. This will use lerna to install dependencies and symlink our packages together.
1. Add your package to the Dockerfile at the root of these packages. You will need to add lines to copy the appropriate files in all sections where there are several copy commands.

## Consuming the Component

The component template outputs an ES6 Module for consumption. If the component uses CSS, then using `import style.scss` will work just fine within the component.

To use the component, import it from the package such as `import { Example } from '@deephaven/component-template';`.
The way this template is configured, you MUST have some sort of bundler which handles CSS imports if the component uses Sass/CSS.

This mostly stems from the author of Webpack saying you shouldn't really nest Webpack bundles (consume a bundle then create another bundle). Check [here](https://github.com/webpack/webpack/issues/11277#issuecomment-670850832) for their comments. Also we don't have any plans for releasing the components as UMD/AMD/etc. and only as ESModules, so Webpack isn't necessary at the component level.

## Component Entry Point

The defualt entry point is `src/index.ts`. The entry point should serve as a collection of everything you want to expose from the component. It will likely contain re-exports like `export { default as Something } from './Something'`. If you need a different entry point (such as `.js` instead), change the `source` property in `package.json`.

## Build

The build step will transpile TS to JS (using Babel), generate type declarations (using TSC), compile Sass to CSS (using dart-sass), and update .scss imports to import .css files (using Babel). Everything will be put in the `dist` folder. The babel config is located at the root of the web client-ui packages. You can extend/override parts of it by creating a `.babelrc`

All JS/TS/JSX/TSX files you want in the output MUST be in `./src` since it is set as the `rootDir` in `tsconfig.json`

If you need another type of file copied, you will need to add it to the build process (Babel can be used with `--copy-files --no-copy-ignored` which should work since it ignores all the test/sass/storybook files)

If for some reason you need to build somewhere that isn't `dist`, you must update `tsconfig.json` and `package.json` to replace everywhere that `dist` is used with whatever you decide to build with.

The reason we use Babel and TSC is Babel doesn't actually type check TypeScript. TSC is set to emit declarations only.

## Start

`npm start` will run watch for changes to TS, JS, JSX, TSX, and SCSS files. On change they should be recompiled automatically and placed in the `dist` folder for the consuming app to detect and rebuild.

## Test

`npm test` will run Jest tests in watch mode. There are tests which run ESLint and Stylelint on all applicable files already included in `src/test`

## Linting

ESLint, Prettier, and Stylelint configs are all set at the root level of the web folder in the monorepo. If you need to override some rules or add additional rules, add them to their proper config file or `package.json` to cascade with the existing rules. See more for [ESLint](https://eslint.org/docs/user-guide/configuring/configuration-files#cascading-and-hierarchy), [Prettier](https://prettier.io/docs/en/configuration.html), and [Stylelint](https://stylelint.io/user-guide/configure)

You can add an `.eslintignore` file if needed.

## Storybook

You can use [Storybook](https://storybook.js.org/) to isolate your component for development. Just use `npm run storybook` to start a Storybook server for this component.

Storybook is setup with a default config in this template. Any `.stories.(jsx?|tsx?|mdx)` file should be picked up by Storybook and ignored by the build process.

## Best Practices

### Removing Unused Dependencies

React and react-dom are listed as peer dependencies. If your component doesn't need either, then remove them from peer and dev dependencies (and `@types/react`).

If not using sass, you can remove the dev dependency for sass and also remove the sass targeted scripts such as `build:sass` and `watch:sass`

`@testing-library/react` is a react component testing library. We currently use `enzyme` in several packages. Or you may not need this at all.

`gh-pages` is currently listed but not used by any scripts in this template.

### PropTypes

While prop-types is only truly needed for JS components, you should still keep and use the package for TS components.
It is unfortunately redundant when you have types in TS, but using `Component.propTypes` will keep it around for JS and give prop type errors in the browser.

If `Component.propTypes` is omitted in TS, it is still possible to pass the linter tests, but any consumption of the component by JS won't get TS type hints or browser prop type errors. This could easily lead to bugs when consuming the component in JS.

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](../../LICENSE) file.
