import CsvParser from './CsvParser';
import CsvFormats from './CsvFormats';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const makeParser = () =>
  new CsvParser({
    onFileCompleted: () => {},
    session: null,
    file: null,
    type: CsvFormats.DEFAULT_TYPE,
    readHeaders: true,
    onProgress: () => {},
    onError: () => {},
    timeZone: '',
    isZip: true,
  });

it('generates the correct number of headers', () => {
  for (let n = 0; n < 1000; n += 1) {
    expect(CsvParser.generateHeaders(n).length).toBe(n);
  }
});

it('generates correct headers', () => {
  expect(CsvParser.generateHeaders(26).join('')).toBe(ALPHABET);

  const manyHeaders = CsvParser.generateHeaders(28 * 26);
  expect(manyHeaders[26]).toBe('AA');
  expect(manyHeaders[26 + 25]).toBe('AZ');
  expect(manyHeaders[2 * 26]).toBe('BA');
  expect(manyHeaders[2 * 26 + 25]).toBe('BZ');
  expect(manyHeaders[3 * 26]).toBe('CA');
  expect(manyHeaders[3 * 26 + 25]).toBe('CZ');
  expect(manyHeaders[27 * 26]).toBe('AAA');
  expect(manyHeaders[27 * 26 + 25]).toBe('AAZ');
});

it('generates correct headers recursively', () => {
  expect(CsvParser.generateHeaderRecursive(0)).toBe('A');
  expect(CsvParser.generateHeaderRecursive(25)).toBe('Z');
  expect(CsvParser.generateHeaderRecursive(26)).toBe('AA');
  expect(CsvParser.generateHeaderRecursive(25 + 26)).toBe('AZ');
  expect(CsvParser.generateHeaderRecursive(2 * 26)).toBe('BA');
  expect(CsvParser.generateHeaderRecursive(2 * 26 + 25)).toBe('BZ');
  expect(CsvParser.generateHeaderRecursive(3 * 26)).toBe('CA');
  expect(CsvParser.generateHeaderRecursive(3 * 26 + 25)).toBe('CZ');
  expect(CsvParser.generateHeaderRecursive(27 * 26)).toBe('AAA');
  expect(CsvParser.generateHeaderRecursive(27 * 26 + 25)).toBe('AAZ');
});

it('transposes correctly', () => {
  const csvParser = makeParser();
  // 3x3
  expect(
    csvParser.transpose(3, [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])
  ).toStrictEqual([
    [1, 4, 7],
    [2, 5, 8],
    [3, 6, 9],
  ]);
  // 3x4
  expect(
    csvParser.transpose(4, [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
    ])
  ).toStrictEqual([
    [1, 5, 9],
    [2, 6, 10],
    [3, 7, 11],
    [4, 8, 12],
  ]);
  // 4x3
  expect(
    csvParser.transpose(3, [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [10, 11, 12],
    ])
  ).toStrictEqual([
    [1, 4, 7, 10],
    [2, 5, 8, 11],
    [3, 6, 9, 12],
  ]);
});

it('drops extra columns', () => {
  const csvParser = makeParser();
  expect(
    csvParser.transpose(3, [
      ['col1', 'col2', 'col3', 'col4'],
      [1, 2, 3, 4],
      [1, 2, 3],
      [1, 2, 3, 4, 5],
    ])
  ).toStrictEqual([
    ['col1', 1, 1, 1],
    ['col2', 2, 2, 2],
    ['col3', 3, 3, 3],
  ]);

  expect(
    csvParser.transpose(3, [
      ['col1', 'col2', 'col3'],
      [1, 2, 3, 4],
      [1, 2, 3],
      [1, 2, 3, 4, 5],
    ])
  ).toStrictEqual([
    ['col1', 1, 1, 1],
    ['col2', 2, 2, 2],
    ['col3', 3, 3, 3],
  ]);
});

it('throws an error for insufficient columns', () => {
  const csvParser = makeParser();
  expect(() =>
    csvParser.transpose(3, [
      ['col1', 'col2', 'col3'],
      [1, 2, 3, 4],
      [1, 2, 3],
      [1, 2],
    ])
  ).toThrow(new Error('Insufficient columns. Expected 3 but found 2\n1,2'));
});
