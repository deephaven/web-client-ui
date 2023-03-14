import TableColumnFormatter, {
  TableColumnFormat,
} from './TableColumnFormatter';

const VALID_FORMAT: TableColumnFormat = {
  label: 'test',
  formatString: '0.0',
  type: 'type-context-custom',
};

describe('isValid', () => {
  it('should return true', () => {
    expect(TableColumnFormatter.isValid(VALID_FORMAT)).toBe(true);
  });
});

describe('isSameFormat', () => {
  it('should throw an error', () => {
    expect(() =>
      TableColumnFormatter.isSameFormat(VALID_FORMAT, VALID_FORMAT)
    ).toThrowError('isSameFormat not implemented');
  });
});

describe('makeFormat', () => {
  it('returns a TableColumnFormat object with the given arguments', () => {
    expect(
      TableColumnFormatter.makeFormat('test', '0.0', 'type-context-custom')
    ).toEqual(VALID_FORMAT);
  });
});

describe('format', () => {
  it('returns an empty string', () => {
    const formatter = new TableColumnFormatter();
    expect(formatter.format('test')).toBe('');
  });
});
