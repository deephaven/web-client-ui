# @deephaven/golden-layout

This is a fork of [https://golden-layout.com/](https://golden-layout.com/) from their v1.5.9 with bug fixes and improvements.

## Installation

`npm install @deephaven/golden-layout`
`import GoldenLayout from @deephaven/golden-layout`

## Build

`npm run build` converts SCSS to `src/css` and combines the JS files into the `dist/` folder.

## Development

Install packages `npm install`
Start watch server with `npm start`
This will recompile the files to dist and css on change.
The package must be consumed to see changes (such as in code-studio)

## Testing

`npm test` runs tests in a watch mode. The browser spawned by Karma might crash on some changes though.

`npm run test:ci` runs tests onces and closes the test browser.

## Features

- Native popup windows
- Completely themeable
- Comprehensive API
- Powerful persistence
- Works in IE8+, Firefox, Chrome
- Reponsive design

## License

This is a fork from v1.5.9 of https://github.com/golden-layout/golden-layout/tree/v1.5.9

All work by Deephaven after the fork from v1.5.9 is licensed under Apache-2.0.

The original work is licensed under MIT.

The license text for both is found in the LICENSE file.
