/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import { promises as fs } from 'fs';
import path from 'path';
import parser from 'svg-parser';
import svgPathTools from 'svg-path-tools';
// template shape based on fortawesome/fontawesome-free export file shape
import { dtsIndex, cjsIndex, mjsIndex } from './template/indicies.js';

const { parse } = parser;
const { parse: parsePath, scale, stringify } = svgPathTools;
const BUILD_DIR = 'dist';

// sets output viewbox height, and scales width accordingly
const OUTPUT_SIZE = 512;

// these will probably get called as args or something
const codiconFolder = { dir: path.resolve(BUILD_DIR, 'svg/vs'), prefix: 'vs' };
const dhiconFolder = { dir: path.resolve(BUILD_DIR, 'svg/dh'), prefix: 'dh' };

function getPrefixedName(name, prefix) {
  return (
    prefix.toLowerCase() +
    name
      .split('-')
      .map(str => str.charAt(0).toUpperCase() + str.slice(1))
      .join('')
  );
}

async function getFilesInFolder(folder) {
  return fs.readdir(folder);
}

async function getContent(filePath, encoding = 'utf-8') {
  return fs.readFile(filePath, { encoding });
}

/**
 * Takes file a path and returns an array of objects
 * containing {name: file name, content: file contents}
 * @param {{dir, prefix}} src
 * @returns {Array} Arrary of objects {filename, contents}
 *
 */
async function getFiles(src) {
  const files = await getFilesInFolder(src.dir);
  const contents = await Promise.all(
    files
      .filter(file => file.slice(file.length - 1) !== '.svg')
      .map(async file => {
        const name = file.slice(0, -4);
        return {
          name,
          prefix: src.prefix,
          prefixedName: getPrefixedName(name, src.prefix),
          content: await getContent(path.join(src.dir, file)),
        };
      })
  );
  return contents;
}

/**
 * Attempts to parse file contents as svg into an object
 * @param {String} content file contents
 * @returns {Object|Null} returns svg object or null
 */
function parseSvg(content) {
  try {
    return parse(content);
  } catch {
    console.error('unable to parse svg');
    return null;
  }
}

async function getSVGFiles(src) {
  const files = await getFiles(src);
  return files.map(f => {
    if (!f && !f.content) return null;
    const file = f;
    // set svg property on file object
    file.svg = parseSvg(file.content);

    if (!file.svg) {
      console.error(`failed to parse ${file.name}`);
      return null;
    }

    let tagName;
    let viewBox;
    let width;
    let height;
    let childTagName;
    let svgPath;
    try {
      ({
        children: [
          {
            tagName,
            properties: { viewBox, width, height },
            children: [
              // handles vsBlank https://github.com/microsoft/vscode-codicons/issues/110, which has no children
              { tagName: childTagName, properties: { d: svgPath } = {} } = {},
            ],
          },
        ],
      } = file.svg);
    } catch {
      console.error(`failed to parse ${file.name}`, file.svg);
    }

    // if no width and height, fall back to viewbox
    if (
      (width === undefined || height === undefined) &&
      viewBox !== undefined
    ) {
      // expecting "0 0 w h"
      const v = viewBox.split(' ');
      /* eslint-disable prefer-destructuring */
      file.width = v[2];
      file.height = v[3];
      /* eslint-enable prefer-destructuring */
    } else {
      file.width = width;
      file.height = height;
    }

    // fontawesome is expecting the height to be 512
    // scale the path to be that size, and fix the height
    // but let the width scale accordingly
    // https://github.com/FortAwesome/Font-Awesome/issues/17671
    try {
      const parsed = parsePath(svgPath);
      const scaled = scale(parsed, { scale: OUTPUT_SIZE / file.height });
      const scalePathString = stringify(scaled);
      file.path = scalePathString;
    } catch {
      console.error(`${file.prefix} ${file.name}`);
      file.path = svgPath;
    }

    // scale width, and force height maintain aspect
    file.width *= OUTPUT_SIZE / file.height;
    file.height = OUTPUT_SIZE;

    if (
      tagName !== 'svg' ||
      (childTagName !== undefined && childTagName !== 'path') ||
      Number.isNaN(Number.parseFloat(file.width)) ||
      width <= 0 ||
      Number.isNaN(Number.parseFloat(file.height)) ||
      height <= 0 ||
      (childTagName === 'path' && svgPath === undefined)
    ) {
      console.error(
        file.name,
        tagName,
        childTagName,
        width,
        height,
        svgPath,
        JSON.stringify(file.svg, null, 2)
      );
      console.error('SVG data not in expected shape');
      return null;
    }
    return file;
  });
}

async function build(buildSources) {
  await fs.mkdir(`${BUILD_DIR}`, { recursive: true });

  let files = await Promise.all(buildSources.map(src => getSVGFiles(src)));

  // flatten the array, as mulitple sources may have been passed in
  files = files.flat();

  // write out an index.d.ts
  const indexdtsContent = dtsIndex(files, buildSources);
  await fs.writeFile(`${BUILD_DIR}/index.d.ts`, indexdtsContent);

  // write out CJS
  const indexjsContent = cjsIndex(files);
  await fs.writeFile(`${BUILD_DIR}/index.cjs`, indexjsContent);

  // write out ESM
  const indexesjsContent = mjsIndex(files);
  await fs.writeFile(`${BUILD_DIR}/index.js`, indexesjsContent);

  console.log('deephaven-app-icons build complete!');
}

build([codiconFolder, dhiconFolder]);
