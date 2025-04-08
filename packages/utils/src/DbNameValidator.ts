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

// The '$' character is not valid in Deephaven table and column names,
// yet it is treated as valid in the DbNameValidator Java class.
// TODO: Update the regexes once DH-19169 is merged.

// From io.deephaven.db.tables.utils.DBNameValidator#STERILE_TABLE_AND_NAMESPACE_REGEX
const STERILE_TABLE_AND_NAMESPACE_REGEX = /[^a-zA-Z0-9_$\-+@]/g;

// From io.deephaven.db.tables.utils.DBNameValidator#STERILE_COLUMN_AND_QUERY_REGEX
const STERILE_COLUMN_AND_QUERY_REGEX = /[^A-Za-z0-9_$]/g;

// From io.deephaven.db.tables.utils.DBNameValidator#TABLE_NAME_PATTERN
const TABLE_NAME_PATTERN = /^[a-zA-Z_$][a-zA-Z0-9_$\-+@]*$/;

const STERILE_VARIABLE_NAME_REGEX = /[^a-zA-Z0-9_$]/g;

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

    // Check if the name ended up blank and append the prefix.
    // Note, io.deephaven.db.tables.utils.DBNameValidator throws an exception in this case.
    if (!legalName) {
      return prefix + i;
    }

    // If name starts with a number or a dash, append the prefix.
    // Note, io.deephaven.db.tables.utils.DBNameValidator throws an exception for names starting with a dash.
    if (/^[0-9-]/.test(legalName)) {
      legalName = prefix + legalName;
    }

    return legalName;
  };

  /**
   * Get a legal table name based on the passed in string.
   * Follows the same rules as DBNameValidator.java except that here
   * we prepend a prefix in cases where the Java class throws an exception.
   * @param name The name to legalize
   * @returns Legalized table name
   */
  static legalizeTableName = (name: string): string =>
    DbNameValidator.legalize(
      name,
      tableNameReplacer,
      TABLE_PREFIX,
      STERILE_TABLE_AND_NAMESPACE_REGEX,
      false,
      0
    );

  /**
   * Get a variable name based on the passed in string.
   * @param name The name to get the variable name for
   * @returns Variable name
   */
  static makeVariableName = (name: string): string =>
    DbNameValidator.legalizeTableName(name).replace(
      STERILE_VARIABLE_NAME_REGEX,
      '_'
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
    TABLE_NAME_PATTERN.test(name);

  static isValidColumnName = (name: string): boolean =>
    DbNameValidator.legalizeColumnName(name) === name;
}

export default DbNameValidator;
