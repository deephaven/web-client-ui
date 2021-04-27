class CsvFormats {
  static DEFAULT_TYPE = 'DEFAULT_CSV';

  static AUTO = 'AUTODETECT';

  static fromExtension(fileName) {
    if (fileName.endsWith('.csv')) {
      return 'DEFAULT_CSV';
    }
    if (fileName.endsWith('.tsv') || fileName.endsWith('.tab')) {
      return 'TSV';
    }
    if (fileName.endsWith('.psv')) {
      return 'PIPE_SV';
    }
    return 'AUTODETECT';
  }

  static TYPES = Object.freeze({
    DEFAULT_CSV: {
      name: 'Default csv (trimmed)',
      delimiter: ',',
      newline: '', // autodetect
      escapeChar: '"',
      shouldTrim: true,
      skipEmptyLines: true,
      nullString: '(null)',
    },

    TSV: {
      name: 'Tab seperated (tsv)',
      delimiter: '\t',
      newline: '', // autodetect
      escapeChar: '"',
      shouldTrim: true,
      skipEmptyLines: true,
      nullString: '(null)',
    },

    // From org.apache.commons.csv.CSVFormat#DEFAULT
    APACHE_COMMON_CSV: {
      name: 'Apache Common csv',
      delimiter: ',',
      newline: '\r\n',
      escapeChar: '"',
      shouldTrim: true,
      skipEmptyLines: true,
      nullString: null,
    },

    // From org.apache.commons.csv.CSVFormat#EXCEL
    EXCEL_CSV: {
      name: 'Excel csv (strict)',
      delimiter: ',',
      newline: '\r\n',
      escapeChar: '"',
      shouldTrim: true,
      skipEmptyLines: false,
      nullString: null,
    },

    // From org.apache.commons.csv.CSVFormat#MYSQL
    MY_SQL_CSV: {
      name: 'MySQL csv',
      delimiter: '\t',
      newline: '\n',
      escapeChar: '\\',
      shouldTrim: true,
      skipEmptyLines: false,
      nullString: '\\N',
    },

    // From org.apache.commons.csv.CSVFormat#RFC4180
    RFC4180_CSV: {
      name: 'RFC4180 csv',
      delimiter: ',',
      newline: '\r\n',
      escapeChar: '"',
      shouldTrim: true,
      skipEmptyLines: false,
      nullString: null,
    },

    COLON_SV: {
      name: ': colon sv',
      delimiter: ':',
      newline: '', // autodetect
      escapeChar: '"',
      shouldTrim: true,
      skipEmptyLines: true,
      nullString: '(null)',
    },

    SEMI_COLON_SV: {
      name: '; semi-colon sv',
      delimiter: ';',
      newline: '', // autodetect
      escapeChar: '"',
      shouldTrim: true,
      skipEmptyLines: true,
      nullString: '(null)',
    },

    PIPE_SV: {
      name: '| pipe separated (psv)',
      delimiter: '|',
      newline: '', // autodetect
      escapeChar: '"',
      shouldTrim: true,
      skipEmptyLines: true,
      nullString: '(null)',
    },

    SPACE_SV: {
      name: '" " space sv',
      delimiter: ' ',
      newline: '', // autodetect
      escapeChar: '"',
      shouldTrim: true,
      skipEmptyLines: true,
      nullString: '(null)',
    },

    AUTODETECT: {
      name: 'autodetect',
      delimiter: '', // autodetect
      newline: '', // autodetect
      escapeChar: '"',
      shouldTrim: true,
      skipEmptyLines: true,
      nullString: '(null)',
    },
  });
}

export default CsvFormats;
