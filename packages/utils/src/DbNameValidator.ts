const TABLE_PREFIX = 'table_';

const COLUMN_PREFIX = 'column_';

// From io.deephaven.db.tables.utils.DBNameValidator#DB_RESERVED_VARIABLE_NAMES
const DB_RESERVED_VARIABLE_NAMES = new Set(['in', 'not', 'i', 'ii', 'k']);

// From javax.lang.model.SourceVersion#keywords
const JAVA_KEYWORDS = new Set([
  'abstract',
  'continue',
  'for',
  'new',
  'switch',
  'assert',
  'default',
  'if',
  'package',
  'synchronized',
  'boolean',
  'do',
  'goto',
  'private',
  'this',
  'break',
  'double',
  'implements',
  'protected',
  'throw',
  'byte',
  'else',
  'import',
  'public',
  'throws',
  'case',
  'enum',
  'instanceof',
  'return',
  'transient',
  'catch',
  'extends',
  'int',
  'short',
  'try',
  'char',
  'final',
  'interface',
  'static',
  'void',
  'class',
  'finally',
  'long',
  'strictfp',
  'volatile',
  'const',
  'float',
  'native',
  'super',
  'while',
  'null',
  'true',
  'false',
]);

// From io.deephaven.db.tables.utils.DBNameValidator#STERILE_TABLE_AND_NAMESPACE_REGEX
const STERILE_TABLE_AND_NAMESPACE_REGEX = /[^a-zA-Z0-9_$\-+@]/g;

// From io.deephaven.db.tables.utils.DBNameValidator#STERILE_COLUMN_AND_QUERY_REGEX
const STERILE_COLUMN_AND_QUERY_REGEX = /[^A-Za-z0-9_$]/g;

// From io.deephaven.db.tables.utils.DBNameValidator#TABLE_NAME_PATTERN
const TABLE_NAME_PATTERN = /^[a-zA-Z_$][a-zA-Z0-9_$\-+@]*$/g;

function columnNameReplacer(input: string): string {
  // Replace all dashes and spaces with underscores
  return input.replace(/[ -]/g, '_');
}

function tableNameReplacer(input: string): string {
  // Replace spaces with underscores
  return input.replace(/\s/g, '_');
}

/**
 * Similar to DBNameValidator.java, this class has utilities for validating and legalizing
 * Table and Column names.
 */
class DbNameValidator {
  static legalize = (
    name: string,
    replace: (input: string) => string,
    prefix: string,
    regex: RegExp,
    checkReserved: boolean,
    i: number
  ): string => {
    let legalName = replace(name.trim());

    // Add prefix to reserved names
    if (
      checkReserved &&
      (DB_RESERVED_VARIABLE_NAMES.has(legalName) ||
        JAVA_KEYWORDS.has(legalName))
    ) {
      legalName = prefix + legalName;
    }

    // Remove illegal characters
    legalName = legalName.replace(regex, '');

    // Check if the name ended up blank
    if (!legalName) {
      legalName = prefix + i;
    }

    // If name starts with a number, append prefix to the front
    if (!Number.isNaN(Number(legalName.charAt(0)))) {
      legalName = prefix + legalName;
    }

    return legalName;
  };

  static legalizeTableName = (name: string): string =>
    DbNameValidator.legalize(
      name,
      tableNameReplacer,
      TABLE_PREFIX,
      STERILE_TABLE_AND_NAMESPACE_REGEX,
      false,
      0
    );

  static legalizeColumnNames = (headers: string[]): string[] => {
    const legalHeaders: string[] = [];
    headers.forEach((header, i) => {
      let legalHeader = DbNameValidator.legalizeColumnName(header, i);

      // Check if the name is already in use
      if (legalHeaders.includes(legalHeader)) {
        legalHeader = COLUMN_PREFIX + i;
      }

      legalHeaders.push(legalHeader);
    });
    return legalHeaders;
  };

  static legalizeColumnName = (header: string, i = 0): string =>
    // Replace all dashes and spaces with underscores
    DbNameValidator.legalize(
      header,
      columnNameReplacer,
      COLUMN_PREFIX,
      STERILE_COLUMN_AND_QUERY_REGEX,
      true,
      i
    );

  static isValidTableName = (name: string): boolean =>
    name.match(TABLE_NAME_PATTERN) !== null;

  static isValidColumnName = (name: string): boolean =>
    DbNameValidator.legalizeColumnName(name) === name;
}

export default DbNameValidator;
