// Used to build iconName.d.ts files
// Based on font-awesome exports
export const dtsFile = prefixedName =>
  `import { IconDefinition, IconPrefix, IconName } from "@fortawesome/fontawesome-common-types";
export const definition: IconDefinition;
export const ${prefixedName}: IconDefinition;
export const prefix: IconPrefix;
export const iconName: IconName;
export const width: number;
export const height: number;
export const ligatures: string[];
export const unicode: string;
export const svgPathData: string;`;

// Based on font-awesome exports
// path can be undefined for vsBlank
export const jsFile = (file, width, height, path) =>
  `'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var prefix = '${file.prefix}';
var iconName = '${file.name}';
var width = ${width};
var height = ${height};
var ligatures = [];
var unicode = 'ff00'; // js usage doesn't care
var svgPathData = ${path ? `'${path}'` : path};

exports.definition = {
  prefix: prefix,
  iconName: iconName,
  icon: [
    width,
    height,
    ligatures,
    unicode,
    svgPathData
  ]};

exports.faAddressBook = exports.definition;
exports.prefix = prefix;
exports.iconName = iconName;
exports.width = width;
exports.height = height;
exports.ligatures = ligatures;
exports.unicode = unicode;
exports.svgPathData = svgPathData;`;
