const fs = require('fs').promises;
const path = require('path');
const { parse } = require('svg-parser');

const { parse: parsePath, scale, stringify } = require('svg-path-tools');

// template shape based on fortawesome/fontawesome-free export file shape
const { dtsFile, jsFile } = require('./template/file');
const { indexdts, indexjs, indexesjs } = require('./template/indicies');

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

async function createDefinition(file) {
  // use imported template literals to build files
  const dtsContent = dtsFile(file.prefixedName);
  const jsContent = jsFile(file, file.width, file.height, file.path);

  try {
    await Promise.all([
      await fs.writeFile(
        path.join(BUILD_DIR, `${file.prefixedName}.d.ts`),
        dtsContent
      ),
      await fs.writeFile(
        path.join(BUILD_DIR, `${file.prefixedName}.js`),
        jsContent
      ),
    ]);
  } catch (e) {
    console.error(e);
  }
}

async function getSVGFiles(src) {
  const files = await getFiles(src);
  files.forEach(file => {
    if (!file && !file.content) return;

    // set svg property on file object
    file.svg = parseSvg(file.content);

    if (!file.svg) {
      console.error(`failed to parse ${file.name}`);
      return;
    }

    const {
      children: [
        {
          tagName,
          properties: { viewBox, width, height },
          children: [
            {
              tagName: childTagName,
              properties: { d: svgPath },
            },
          ],
        },
      ],
    } = file.svg;

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
      childTagName !== 'path' ||
      Number.isNaN(Number.parseFloat(file.width)) ||
      width <= 0 ||
      Number.isNaN(Number.parseFloat(file.height)) ||
      height <= 0 ||
      svgPath === undefined
    ) {
      console.error(file.name, tagName, childTagName, width, height, svgPath);
      console.error('SVG data not in expected shape');
      file = null;
    }
  });

  return files;
}

async function build(buildSources) {
  await fs.mkdir(`${BUILD_DIR}`, { recursive: true });

  let files = await Promise.all(buildSources.map(src => getSVGFiles(src)));

  // flatten the array, as mulitple sources may have been passed in
  files = files.flat();

  // write out the individual definition files
  await Promise.all(files.map(file => createDefinition(file)));

  // write out an index.d.ts
  const indexdtsContent = indexdts(files, buildSources);
  await fs.writeFile(`${BUILD_DIR}/index.d.ts`, indexdtsContent);

  // write out index.js
  const indexjsContent = indexjs(files);
  await fs.writeFile(`${BUILD_DIR}/index.js`, indexjsContent);

  // write out index.es.js
  const indexesjsContent = indexesjs(files);
  await fs.writeFile(`${BUILD_DIR}/index.es.js`, indexesjsContent);

  console.log('deephaven-app-icons build complete!');
}

build([codiconFolder, dhiconFolder]);
