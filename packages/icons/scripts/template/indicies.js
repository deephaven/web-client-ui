export const indexdts = (files, sources) => {
  const top = files
    .map(file => `export const ${file.prefixedName}: IconDefinition;`)
    .join('\n');

  const bottom = sources
    .map(src => `export const ${src.prefix}: IconPack;`)
    .join('\n');

  return ` 
${top}
import { IconDefinition, IconLookup, IconName, IconPrefix, IconPack } from '@fortawesome/fontawesome-common-types';
export { IconDefinition, IconLookup, IconName, IconPrefix, IconPack } from '@fortawesome/fontawesome-common-types';
export const prefix: IconPrefix;
${bottom}
`;
};

export const indexjs = files => {
  const iconVar = files
    .map(
      file => `
  var ${file.prefixedName} = {
    prefix: "${file.prefix}",
    iconName: "${file.name}",
    icon: [${file.width}, ${file.height}, [], "f000", ${
        file.path ? `"${file.path}"` : file.path
      }]
  };`
    )
    .join('');

  const cache = files
    .map(file => `    ${file.prefixedName}:${file.prefixedName},`)
    .join('\n');

  const exps = files
    .map(file => `  exports.${file.prefixedName} = ${file.prefixedName};`)
    .join('\n');

  return `(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global['deephaven-app-icons'] = {})));
  }(this, (function (exports) { 'use strict';

  var prefix = "dh";${iconVar}
  var _iconsCache = {
${cache}
  };

  exports.dh = _iconsCache;
  exports.prefix = prefix;
${exps}

  Object.defineProperty(exports, '__esModule', { value: true });

})));
`;
};

export const indexesjs = files => {
  const iconVar = files
    .map(
      file => `
var ${file.prefixedName} = {
  prefix: "${file.prefix}",
  iconName: "${file.name}",
  icon: [${file.width}, ${file.height}, [], "f000", ${
        file.path ? `"${file.path}"` : file.path
      }]
};`
    )
    .join('');

  const cache = files
    .map(file => `  ${file.prefixedName}:${file.prefixedName},`)
    .join('\n');

  const exps = files.map(file => `${file.prefixedName}, `).join('');

  return `
var prefix = "dh";${iconVar}
var _iconsCache = {
${cache}
};

export { _iconsCache as dh, prefix, ${exps}};
`;
};
