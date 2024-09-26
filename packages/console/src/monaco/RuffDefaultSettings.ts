const RUFF_DEFAULT_SETTINGS = {
  preview: true,
  'target-version': 'py38',
  'line-length': 88,
  'indent-width': 4,
  format: {
    'indent-style': 'space',
    'quote-style': 'double',
  },
  lint: {
    'flake8-implicit-str-concat': {
      'allow-multiline': false,
    },
    // More info on rules at https://docs.astral.sh/ruff/rules/
    ignore: ['ISC003'], // Ignoring this rule permits explicit string concatenation
    select: [
      'F', // Pyflakes
      'E1', // Pycodestyle indentation errors
      'E9', // Pycodestyle syntax errors
      'E711', // Pycodestyle comparison to None
      'W291', // Pycodestyle trailing whitespace
      'W293', // Pycodestyle blank line contains whitespace
      'W605', // Pycodestyle invalid escape sequence
      'B', // flake8-bugbear
      'A', // flake8-builtins
      'COM818', // flake8-commas trailing comma on bare tuple
      'ISC', // flake8-implicit-str-concat
      'PLE', // pylint errors
      'RUF001', // ambiguous-unicode-character-string
      'RUF021', // parenthesize-chained-operators
      'RUF027', // missing-f-string-syntax
      'PLR1704', // Redefined argument from local
      'LOG', // flake8-logging
      'ASYNC', // flake8-async
      'RET501', // unnecessary-return-none
      'RET502', // implicit-return-value
      'RET503', // implicit-return
      'PLC2401', // non-ascii-name
      'PLC2403', // non-ascii-import-name
      'NPY', // NumPy-specific rules
      'PERF', // Perflint
      'C4', // flake8-comprehensions
    ],
  },
};

export default RUFF_DEFAULT_SETTINGS;
