const { lstatSync, readdirSync } = require('fs');
const path = require('path');

const basePath = path.resolve(__dirname, 'packages');
const packages = readdirSync(basePath).filter(name =>
  lstatSync(path.join(basePath, name)).isDirectory()
);

module.exports = {
  // preset: 'ts-jest/presets/js-with-ts',
  // globals: {
  //   'ts-jest': {
  //     useESM: true,
  //   },
  // },
  // preset: 'ts-jest',
  transform: {
    '.(ts|tsx|js|jsx)': 'ts-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': path.resolve(
      './__mocks__/fileMock.js'
    ),
    // ...packages.reduce(
    //   (acc, name) => ({
    //     ...acc,
    //     [`@deephaven/${name}(.*)$`]: `<rootDir>/packages/${name}/src/$1`,
    //   }),
    //   {}
    // ),
  },
  // modulePathIgnorePatterns: [
  //   ...packages.reduce(
  //     (acc, name) => [...acc, `<rootDir>/packages/${name}/dist`],
  //     []
  //   ),
  // ],
};
