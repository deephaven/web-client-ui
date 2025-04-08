import DbNameValidator from './DbNameValidator';

const TABLE_PREFIX = 'table_';
const COLUMN_PREFIX = 'column_';

const VALID_TABLE_NAMES = ['$+@abc-123_ABC', '$'];
const VARIABLE_NAMES_FROM_VALID = ['$__abc_123_ABC', '$'];

const INVALID_TABLE_NAMES = ['%^&ab-c', '-a_b c', '-', '0', '%', ''];
const LEGALIZED_INVALID_TABLE_NAMES = [
  'ab-c',
  'table_-a_b_c',
  'table_-',
  'table_0',
  'table_0',
  'table_0',
];
const VARIABLE_NAMES_FROM_INVALID = [
  'ab_c',
  'table__a_b_c',
  'table__',
  'table_0',
  'table_0',
  'table_0',
];

const VALID_COL_NAME = 'abc123_ABC';
const INVALID_COL_NAME = '@abc123_ABC-123';
const CLEANED_INVALID_COL_NAME = 'abc123_ABC_123';

const START_WITH_NUM = '123abc';
const RESERVED_JAVA_WORD = 'return';
const RESERVED_DEEPHAVEN_WORD = 'not';

describe('Table name validation', () => {
  it.each(VALID_TABLE_NAMES)('Returns true on valid table name %s', name => {
    expect(DbNameValidator.isValidTableName(name)).toBe(true);
  });

  it.each(INVALID_TABLE_NAMES)(
    'Returns false on invalid table name %s',
    name => {
      expect(DbNameValidator.isValidTableName(name)).toBe(false);
    }
  );
});

describe('Column name validation', () => {
  it('Returns true on valid column names', () => {
    expect(DbNameValidator.isValidColumnName(VALID_COL_NAME)).toBe(true);
  });

  it('Returns false on invalid column names', () => {
    expect(DbNameValidator.isValidColumnName(INVALID_COL_NAME)).toBe(false);
  });

  it('Returns false on reserved Java keyword', () => {
    expect(DbNameValidator.isValidColumnName(RESERVED_JAVA_WORD)).toBe(false);
  });

  it('Returns false on reserved Deephaven keyword', () => {
    expect(DbNameValidator.isValidColumnName(RESERVED_DEEPHAVEN_WORD)).toBe(
      false
    );
  });
});

describe('legalizeTableName', () => {
  it.each(VALID_TABLE_NAMES)('Does not change a valid table name %s', name => {
    expect(DbNameValidator.legalizeTableName(name)).toBe(name);
  });

  it.each(
    INVALID_TABLE_NAMES.map((name, i) => [
      name,
      LEGALIZED_INVALID_TABLE_NAMES[i],
    ])
  )('Legalize an invalid table name %s > %s', (invalid, cleaned) => {
    expect(DbNameValidator.legalizeTableName(invalid)).toBe(cleaned);
  });

  it('Renames a table name with no valid chars to table_0', () => {
    expect(DbNameValidator.legalizeTableName('^')).toBe('table_0');
  });

  it('Prefixes a column name starting with a number', () => {
    expect(DbNameValidator.legalizeTableName(START_WITH_NUM)).toBe(
      TABLE_PREFIX + START_WITH_NUM
    );
  });
});

describe('makeVariableName', () => {
  it.each(
    VALID_TABLE_NAMES.map((name, i) => [name, VARIABLE_NAMES_FROM_VALID[i]])
  )(
    'Makes a variable name for a valid table name %s > %s',
    (invalid, variableName) => {
      expect(DbNameValidator.makeVariableName(invalid)).toBe(variableName);
    }
  );
  it.each(
    INVALID_TABLE_NAMES.map((name, i) => [name, VARIABLE_NAMES_FROM_INVALID[i]])
  )(
    'Makes a variable name for an invalid table name %s > %s',
    (invalid, variableName) => {
      expect(DbNameValidator.makeVariableName(invalid)).toBe(variableName);
    }
  );
});

describe('legalizeColumnName', () => {
  it('Does not change a valid column name', () => {
    expect(DbNameValidator.legalizeColumnName(VALID_COL_NAME)).toBe(
      VALID_COL_NAME
    );
  });

  it('Legalize an invalid column name', () => {
    expect(DbNameValidator.legalizeColumnName(INVALID_COL_NAME)).toBe(
      CLEANED_INVALID_COL_NAME
    );
  });

  it('Prefixes a column name that is a reserved word', () => {
    expect(DbNameValidator.legalizeColumnName(RESERVED_JAVA_WORD)).toBe(
      COLUMN_PREFIX + RESERVED_JAVA_WORD
    );
  });

  it('Prefixes a column name starting with a number', () => {
    expect(DbNameValidator.legalizeColumnName(START_WITH_NUM)).toBe(
      COLUMN_PREFIX + START_WITH_NUM
    );
  });
});

describe('legalizeColumnNames', () => {
  it('Legalizes an array of mixed validity column names', () => {
    expect(
      DbNameValidator.legalizeColumnNames([VALID_COL_NAME, INVALID_COL_NAME])
    ).toStrictEqual([VALID_COL_NAME, CLEANED_INVALID_COL_NAME]);
  });

  it('Renames a duplicate column name to column_i', () => {
    expect(
      DbNameValidator.legalizeColumnNames([VALID_COL_NAME, VALID_COL_NAME])
    ).toStrictEqual([VALID_COL_NAME, 'column_1']);
  });
});
