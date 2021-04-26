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
const STERILE_TABLE_AND_NAMESPACE_REGEX = /[^a-zA-Z0-9_$+@-]/g;

// From io.deephaven.db.tables.utils.DBNameValidator#STERILE_COLUMN_AND_QUERY_REGEX
const STERILE_COLUMN_AND_QUERY_REGEX = /[^A-Za-z0-9_$]/g;

/**
 * Similar to DBNameValidator.java, this class has utilities for validating and legalizing
 * Table and Column names.
 */
class DbNameValidator {
  static legalize = (name, prefix, regex, checkReserved, i) => {
    // Replace all dashes and spaces with underscores
    let legalName = name.trim().replace(/[- ]/g, '_');

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
    // Intentionally using isNaN rather than Number.isNaN
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(legalName.charAt(0))) {
      legalName = prefix + legalName;
    }

    return legalName;
  };

  static legalizeTableName = name =>
    DbNameValidator.legalize(
      name,
      TABLE_PREFIX,
      STERILE_TABLE_AND_NAMESPACE_REGEX,
      false,
      0
    );

  static legalizeColumnNames = headers => {
    const legalHeaders = [];
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

  static legalizeColumnName = (header, i = 0) =>
    // Replace all dashes and spaces with underscores
    DbNameValidator.legalize(
      header,
      COLUMN_PREFIX,
      STERILE_COLUMN_AND_QUERY_REGEX,
      true,
      i
    );

  static isValidTableName = name =>
    DbNameValidator.legalizeTableName(name) === name;

  static isValidColumnName = name =>
    DbNameValidator.legalizeColumnName(name) === name;
}

export default DbNameValidator;
