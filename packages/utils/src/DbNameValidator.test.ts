import DbNameValidator from './DbNameValidator';

const TABLE_PREFIX = 'table_';
const COLUMN_PREFIX = 'column_';

const VALID_TABLE_NAME = '$+@abc123_ABC';
const INVALID_TABLE_NAME = '%^&abc';
const CLEANED_INVALID_TABLE_NAME = 'abc';

const VALID_COL_NAME = 'abc123_ABC';
const INVALID_COL_NAME = '@abc123_ABC123';
const CLEANED_INVALID_COL_NAME = 'abc123_ABC123';

const START_WITH_NUM = '123abc';
const RESERVED_JAVA_WORD = 'return';
const RESERVED_DEEPHAVEN_WORD = 'not';

describe('Table name validation', () => {
  it('Returns true on valid table names', () => {
    expect(DbNameValidator.isValidTableName(VALID_TABLE_NAME)).toBe(true);
  });

  it('Returns false on invalid table names', () => {
    expect(DbNameValidator.isValidTableName(INVALID_TABLE_NAME)).toBe(false);
  });
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
  it('Does not change a valid table name', () => {
    expect(DbNameValidator.legalizeTableName(VALID_TABLE_NAME)).toBe(
      VALID_TABLE_NAME
    );
  });

  it('Legalize an invalid table name', () => {
    expect(DbNameValidator.legalizeTableName(INVALID_TABLE_NAME)).toBe(
      CLEANED_INVALID_TABLE_NAME
    );
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
