import { renderHook } from '@testing-library/react-hooks';
import type { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import { useItemRowDeserializer } from './useItemRowDeserializer';
import { getItemKeyColumn, getItemLabelColumn } from './itemUtils';

jest.mock('./itemUtils');

const { asMock, createMockProxy } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useItemRowDeserializer', () => {
  const table = createMockProxy<dh.Table>();
  const row = createMockProxy<dh.Row>();
  const keyColumnName = 'mock.keyColumnName';
  const labelColumnName = 'mock.labelColumnName';
  const keyColumn = createMockProxy<dh.Column>({ name: keyColumnName });
  const labelColumn = createMockProxy<dh.Column>({ name: labelColumnName });
  const formattedValue = 'mock.formattedValue';

  const formatValue = jest.fn().mockName('formatValue');

  beforeEach(() => {
    asMock(getItemKeyColumn).mockReturnValue(keyColumn);
    asMock(getItemLabelColumn).mockReturnValue(labelColumn);
    asMock(formatValue).mockReturnValue(formattedValue);
  });

  it.each([
    [
      'String key + value',
      'mock.keyValue',
      'mock.labelValue',
      undefined,
      {
        key: 'mock.keyValue',
        content: 'mock.labelValue',
        textValue: 'mock.labelValue',
      },
    ],
    [
      'Number key + value',
      888,
      999,
      undefined,
      {
        key: 888,
        content: '999',
        textValue: '999',
      },
    ],
    [
      'Boolean key + value (true, false)',
      true,
      false,
      undefined,
      {
        key: true,
        content: 'false',
        textValue: 'false',
      },
    ],
    [
      'Boolean key + value (false, true)',
      false,
      true,
      undefined,
      {
        key: false,
        content: 'true',
        textValue: 'true',
      },
    ],
    [
      'Object key',
      {},
      {},
      undefined,
      {
        key: String({}),
        content: String({}),
        textValue: String({}),
      },
    ],
    [
      'Custom formatValue',
      'mock.keyValue',
      'mock.labelValue',
      formatValue,
      {
        key: 'mock.keyValue',
        content: formattedValue,
        textValue: formattedValue,
      },
    ],
  ])(
    'should return a function that deserializes a row into a normalized picker item data object: %s',
    (_label, keyValue, labelValue, givenFormatValue, expected) => {
      asMock(row.get).mockImplementation((column: dh.Column) =>
        column === keyColumn ? keyValue : labelValue
      );

      const { result } = renderHook(() =>
        useItemRowDeserializer({
          table,
          keyColumnName,
          labelColumnName,
          formatValue: givenFormatValue,
        })
      );

      expect(getItemKeyColumn).toHaveBeenCalledWith(table, keyColumnName);
      expect(getItemLabelColumn).toHaveBeenCalledWith(
        table,
        keyColumn,
        labelColumnName
      );

      const actual = result.current(row);

      if (givenFormatValue) {
        expect(formatValue).toHaveBeenCalledWith(labelValue, labelColumn.type);
      }

      expect(actual).toEqual(expected);
    }
  );
});
