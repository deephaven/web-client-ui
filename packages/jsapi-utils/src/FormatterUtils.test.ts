import Formatter from './Formatter';
import FormatterUtils from './FormatterUtils';
import {
  TableColumnFormat,
  TableColumnFormatter,
  TableColumnFormatType,
} from './formatters';
import TableUtils from './TableUtils';

function makeFormatter(...settings: ConstructorParameters<typeof Formatter>) {
  return new Formatter(...settings);
}

function makeFormattingRule(
  label: string,
  formatString = '',
  type: TableColumnFormatType = TableColumnFormatter.TYPE_CONTEXT_CUSTOM
): TableColumnFormat {
  return { label, formatString, type };
}

describe('isCustomColumnFormatDefined', () => {
  const columnFormats = [
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DECIMAL,
      'Col 1',
      makeFormattingRule('format 1 custom')
    ),
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DECIMAL,
      'Col 2',
      makeFormattingRule(
        'format 2 preset',
        '',
        TableColumnFormatter.TYPE_CONTEXT_PRESET
      )
    ),
    Formatter.makeColumnFormattingRule(
      TableUtils.dataType.DECIMAL,
      'Col 3',
      makeFormattingRule(
        'format 3 global',
        '',
        TableColumnFormatter.TYPE_GLOBAL
      )
    ),
  ];

  it('is true for columns with custom or preset formats', () => {
    const formatter = makeFormatter(columnFormats);
    expect(
      FormatterUtils.isCustomColumnFormatDefined(
        formatter,
        'Col 1',
        TableUtils.dataType.DECIMAL
      )
    ).toBe(true);
    expect(
      FormatterUtils.isCustomColumnFormatDefined(
        formatter,
        'Col 2',
        TableUtils.dataType.DECIMAL
      )
    ).toBe(true);
  });

  it('is false for columns with global or no format', () => {
    const formatter = makeFormatter(columnFormats);
    expect(
      FormatterUtils.isCustomColumnFormatDefined(
        formatter,
        'Col 3',
        TableUtils.dataType.DECIMAL
      )
    ).toBe(false);
    expect(
      FormatterUtils.isCustomColumnFormatDefined(
        formatter,
        // No format defined for Col 4
        'Col 4',
        TableUtils.dataType.DECIMAL
      )
    ).toBe(false);
  });
});
