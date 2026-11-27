#!/usr/bin/env node
// @ts-check
/**
 * Builds a package's markdown docs for publishing, expanding autodoc
 * directives into API reference generated from the package's JSDoc.
 *
 * Usage:
 *   node scripts/build-docs.mjs <package-dir>
 *
 *   <package-dir>  Package to build docs for, e.g. `packages/grid`. Docs are
 *                  read from `<package-dir>/docs` and written to the gitignored
 *                  `<package-dir>/build/docs`. Symbols are resolved from the
 *                  package.json `source` entry.
 *
 * Directive syntax, in any markdown file under the docs folder:
 *
 *   ```{autodoc} EditableGridModel
 *   ```
 *
 * Each directive is replaced with the symbol's description and, for interfaces,
 * classes and object types, a section per member. Member headings are nested one
 * level below the heading the directive appears under. Callable members render
 * with the `ParamTable` component used by the Deephaven docs site, matching the
 * output of the deephaven.ui `dhautofunction` directive.
 */
/* eslint-disable no-console, no-restricted-syntax, no-continue, import/no-extraneous-dependencies */
import {
  cpSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const DIRECTIVE_REGEX =
  /^```\{autodoc\}[ \t]+(\S+)[ \t]*(?:\r?\n[ \t]*)*\r?\n```[ \t]*$/gm;
const HEADING_REGEX = /^(#{1,6})\s/gm;

/**
 * Escape text that MDX would otherwise parse as JSX or expressions, leaving
 * inline code spans untouched.
 * @param {string} text
 * @returns {string}
 */
function escapeMdx(text) {
  return text
    .split(/(`[^`]*`)/)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part
            .replace(/\{/g, '&#123;')
            .replace(/\}/g, '&#125;')
            .replace(/</g, '&lt;')
    )
    .join('');
}

/**
 * @param {string | ts.NodeArray<ts.JSDocComment> | undefined} comment
 * @returns {string}
 */
function commentToMarkdown(comment) {
  const text = ts.getTextOfJSDocComment(comment) ?? '';
  return text.replace(/\{@link(?:code|plain)?\s+([^}|\s]+)[^}]*\}/g, '`$1`');
}

/**
 * @param {string} text
 * @returns {string}
 */
function singleLine(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * @param {ts.Node | undefined} node
 * @returns {string}
 */
function typeText(node) {
  return node ? singleLine(node.getText()) : '';
}

/**
 * @param {ts.Node} node
 * @returns {readonly ts.JSDocTag[]}
 */
function getTags(node) {
  return ts.getJSDocTags(node);
}

/**
 * @param {ts.Node} node
 * @returns {string}
 */
function getDescription(node) {
  const docs = ts
    .getJSDocCommentsAndTags(node)
    .filter(ts.isJSDoc)
    .map(doc => commentToMarkdown(doc.comment).trim())
    .filter(Boolean);
  return docs.join('\n\n');
}

/**
 * @param {ts.Node} node
 * @param {string} tagName
 * @returns {ts.JSDocTag | undefined}
 */
function findTag(node, tagName) {
  return getTags(node).find(tag => tag.tagName.text === tagName);
}

/**
 * Get the call signature for a member, whether it is declared as a method or as
 * a property with a function type.
 * @param {ts.Node} node
 * @returns {ts.SignatureDeclaration | undefined}
 */
function getSignatureDeclaration(node) {
  if (ts.isFunctionLike(node)) {
    return node;
  }
  if (
    (ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) &&
    node.type != null &&
    ts.isFunctionTypeNode(node.type)
  ) {
    return node.type;
  }
  return undefined;
}

/**
 * @param {ts.Node} docNode Node holding the JSDoc for the signature
 * @param {ts.SignatureDeclaration} signature
 * @param {ts.TypeChecker} checker
 * @param {string} moduleName
 * @param {string} name
 * @returns {string}
 */
function renderSignature(docNode, signature, checker, moduleName, name) {
  const paramDocs = new Map(
    getTags(docNode)
      .filter(ts.isJSDocParameterTag)
      .map(tag => [
        tag.name.getText(),
        singleLine(commentToMarkdown(tag.comment)),
      ])
  );
  const parameters = signature.parameters.map(param => {
    const paramName = param.name.getText();
    return {
      name: `${param.dotDotDotToken != null ? '...' : ''}${paramName}${
        param.questionToken != null ? '?' : ''
      }`,
      type:
        typeText(param.type) ||
        checker.typeToString(checker.getTypeAtLocation(param)),
      description: paramDocs.get(paramName) ?? '',
      default: param.initializer ? singleLine(param.initializer.getText()) : '',
    };
  });

  let returnType = typeText(signature.type);
  if (!returnType) {
    const resolved = checker.getSignatureFromDeclaration(signature);
    returnType = resolved
      ? checker.typeToString(checker.getReturnTypeOfSignature(resolved))
      : '';
  }
  const returnsTag = findTag(docNode, 'returns') ?? findTag(docNode, 'return');
  const returnDescription = returnsTag
    ? singleLine(commentToMarkdown(returnsTag.comment))
    : '';

  const lines = [];
  if (returnType || returnDescription) {
    lines.push(
      `**Returns:** \`${returnType}\` ${escapeMdx(returnDescription)}`.trim(),
      ''
    );
  }
  if (parameters.length > 0) {
    const param = { module_name: moduleName, name, parameters };
    lines.push(`<ParamTable param={${JSON.stringify(param)}} />`, '');
  }
  return lines.join('\n');
}

/**
 * @param {ts.Declaration} declaration
 * @returns {readonly ts.Node[] | undefined}
 */
function getMembers(declaration) {
  if (
    ts.isInterfaceDeclaration(declaration) ||
    ts.isClassDeclaration(declaration)
  ) {
    return declaration.members;
  }
  if (
    ts.isTypeAliasDeclaration(declaration) &&
    ts.isTypeLiteralNode(declaration.type)
  ) {
    return declaration.type.members;
  }
  return undefined;
}

/**
 * @param {ts.Node} node
 * @returns {boolean}
 */
function isHiddenMember(node) {
  if (
    ts.canHaveModifiers(node) &&
    ts
      .getModifiers(node)
      ?.some(
        modifier =>
          modifier.kind === ts.SyntaxKind.PrivateKeyword ||
          modifier.kind === ts.SyntaxKind.ProtectedKeyword
      )
  ) {
    return true;
  }
  const memberName = /** @type {ts.NamedDeclaration} */ (node).name;
  if (memberName != null && ts.isPrivateIdentifier(memberName)) {
    return true;
  }
  return (
    findTag(node, 'internal') != null ||
    findTag(node, 'private') != null ||
    findTag(node, 'hidden') != null
  );
}

/**
 * @param {ts.Node} member
 * @param {ts.TypeChecker} checker
 * @param {string} moduleName
 * @param {string} heading
 * @param {string[]} warnings
 * @returns {string | undefined}
 */
function renderMember(member, checker, moduleName, heading, warnings) {
  if (
    ts.isConstructorDeclaration(member) ||
    ts.isIndexSignatureDeclaration(member)
  ) {
    return undefined;
  }
  const memberName = /** @type {ts.NamedDeclaration} */ (member).name;
  if (memberName == null || isHiddenMember(member)) {
    return undefined;
  }
  const name = memberName.getText();
  const siblings = /** @type {ts.Node[]} */ (
    getMembers(/** @type {ts.Declaration} */ (member.parent)) ?? []
  ).filter(
    sibling =>
      sibling !== member &&
      /** @type {ts.NamedDeclaration} */ (sibling).name?.getText() === name
  );
  // Document a getter/setter pair once, and only the overload signatures of an
  // overloaded method rather than its implementation
  if (
    (ts.isSetAccessor(member) && siblings.some(ts.isGetAccessor)) ||
    (ts.isMethodDeclaration(member) &&
      member.body != null &&
      siblings.some(
        sibling => ts.isMethodDeclaration(sibling) && sibling.body == null
      ))
  ) {
    return undefined;
  }

  const deprecatedTag = findTag(member, 'deprecated');
  const description = getDescription(member);
  if (!description && deprecatedTag == null) {
    warnings.push(`${moduleName}${name} has no JSDoc description`);
  }

  const isStatic =
    ts.canHaveModifiers(member) &&
    (ts
      .getModifiers(member)
      ?.some(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword) ??
      false);
  const displayName = isStatic ? `static ${name}` : name;
  const isAccessor = ts.isGetAccessor(member) || ts.isSetAccessor(member);
  const signature = isAccessor ? undefined : getSignatureDeclaration(member);

  const lines = [];
  if (signature != null) {
    const params = signature.parameters.map(param => param.name.getText());
    lines.push(`${heading} \`${displayName}(${params.join(', ')})\``, '');
  } else {
    lines.push(`${heading} \`${displayName}\``, '');
  }

  if (deprecatedTag != null) {
    const reason = commentToMarkdown(deprecatedTag.comment).trim();
    lines.push(`**Deprecated**${reason ? `: ${escapeMdx(reason)}` : ''}`, '');
  }
  if (description) {
    lines.push(escapeMdx(description), '');
  }

  if (signature != null) {
    lines.push(renderSignature(member, signature, checker, moduleName, name));
  } else {
    const typeNode = ts.isSetAccessor(member)
      ? member.parameters[0]?.type
      : /** @type {ts.PropertySignature} */ (member).type;
    const type =
      typeText(typeNode) ||
      checker.typeToString(checker.getTypeAtLocation(member));
    lines.push(`**Type:** \`${type}\``, '');
  }
  return lines.join('\n');
}

/**
 * Render the API reference for an exported symbol.
 * @param {ts.Symbol} symbol
 * @param {ts.TypeChecker} checker
 * @param {number} headingLevel Heading level for member sections
 * @param {string[]} warnings
 * @returns {string}
 */
function renderSymbol(symbol, checker, headingLevel, warnings) {
  const declarations = symbol.getDeclarations() ?? [];
  const declaration =
    declarations.find(decl => getMembers(decl) != null) ?? declarations[0];
  if (declaration == null) {
    throw new Error(`No declaration found for ${symbol.getName()}`);
  }
  const name = symbol.getName();
  const moduleName = `${name}.`;
  const heading = '#'.repeat(Math.min(headingLevel, 6));
  const lines = [];

  const description = getDescription(declaration);
  if (description) {
    lines.push(escapeMdx(description), '');
  }

  const members = getMembers(declaration);
  if (members != null) {
    for (const member of members) {
      const rendered = renderMember(
        member,
        checker,
        moduleName,
        heading,
        warnings
      );
      if (rendered != null) {
        lines.push(rendered);
      }
    }
  } else {
    const signature = getSignatureDeclaration(declaration);
    if (signature != null) {
      lines.push(renderSignature(declaration, signature, checker, '', name));
    } else if (ts.isTypeAliasDeclaration(declaration)) {
      lines.push(`**Type:** \`${typeText(declaration.type)}\``, '');
    }
  }
  return `${lines.join('\n').trim()}\n`;
}

/**
 * @param {string} packageDir
 * @returns {{ checker: ts.TypeChecker, exports: Map<string, ts.Symbol> }}
 */
function loadPackageExports(packageDir) {
  const packageJson = JSON.parse(
    readFileSync(path.join(packageDir, 'package.json'), 'utf8')
  );
  if (typeof packageJson.source !== 'string') {
    throw new Error(`${packageDir}/package.json has no "source" entry`);
  }
  const entry = path.resolve(packageDir, packageJson.source);
  const configPath = ts.findConfigFile(packageDir, ts.sys.fileExists);
  const compilerOptions = configPath
    ? ts.getParsedCommandLineOfConfigFile(
        configPath,
        {},
        {
          ...ts.sys,
          onUnRecoverableConfigFileDiagnostic: diagnostic => {
            throw new Error(
              ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
            );
          },
        }
      )?.options ?? {}
    : {};
  const program = ts.createProgram([entry], {
    ...compilerOptions,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(entry);
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  if (moduleSymbol == null) {
    throw new Error(`Unable to load module ${entry}`);
  }
  const exports = new Map();
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    exports.set(
      exported.getName(),
      // eslint-disable-next-line no-bitwise
      exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported
    );
  }
  return { checker, exports };
}

/**
 * Heading level one deeper than the last heading before `index`.
 * @param {string} markdown
 * @param {number} index
 * @returns {number}
 */
function getChildHeadingLevel(markdown, index) {
  let level = 1;
  const withoutCode = markdown
    .slice(0, index)
    .replace(/^```[\s\S]*?^```/gm, '');
  for (const match of withoutCode.matchAll(HEADING_REGEX)) {
    level = match[1].length;
  }
  return level + 1;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listMarkdownFiles(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => path.join(entry.parentPath, entry.name));
}

function main() {
  const [packageArg] = process.argv.slice(2);
  if (packageArg == null) {
    console.error('Usage: node scripts/build-docs.mjs <package-dir>');
    process.exit(1);
  }
  const packageDir = path.resolve(packageArg);
  const docsDir = path.join(packageDir, 'docs');
  const outDir = path.join(packageDir, 'build', 'docs');

  rmSync(outDir, { recursive: true, force: true });
  cpSync(docsDir, outDir, { recursive: true });

  /** @type {ReturnType<typeof loadPackageExports> | undefined} */
  let packageExports;
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  for (const file of listMarkdownFiles(outDir)) {
    const markdown = readFileSync(file, 'utf8');
    if (!DIRECTIVE_REGEX.test(markdown)) {
      continue;
    }
    DIRECTIVE_REGEX.lastIndex = 0;
    packageExports ??= loadPackageExports(packageDir);
    const { checker, exports } = packageExports;
    const relativeFile = path.relative(outDir, file);

    const output = markdown.replace(DIRECTIVE_REGEX, (match, name, offset) => {
      const symbol = exports.get(name);
      if (symbol == null) {
        errors.push(
          `${relativeFile}: "${name}" is not exported by the package`
        );
        return match;
      }
      return renderSymbol(
        symbol,
        checker,
        getChildHeadingLevel(markdown, offset),
        warnings
      ).trimEnd();
    });
    writeFileSync(file, output);
  }

  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`);
  }
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`Error: ${error}`);
    }
    process.exit(1);
  }
  console.log(`Built docs to ${path.relative(process.cwd(), outDir)}`);
}

main();
