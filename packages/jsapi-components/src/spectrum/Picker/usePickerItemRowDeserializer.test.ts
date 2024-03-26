import { renderHook } from '@testing-library/react-hooks';
import type { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import { usePickerItemRowDeserializer } from './usePickerItemRowDeserializer';
import { getPickerKeyColumn, getPickerLabelColumn } from './PickerUtils';

jest.mock('./PickerUtils');

const { asMock, createMockProxy } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('usePickerItemRowDeserializer', () => {
  const table = createMockProxy<dh.Table>();
  const row = createMockProxy<dh.Row>();
  const keyColumnName = 'mock.keyColumnName';
  const labelColumnName = 'mock.labelColumnName';
  const keyColumn = createMockProxy<dh.Column>({ name: keyColumnName });
  const labelColumn = createMockProxy<dh.Column>({ name: labelColumnName });
  const formattedValue = 'mock.formattedValue';

  const formatValue = jest.fn().mockName('formatValue');

  beforeEach(() => {
    asMock(getPickerKeyColumn).mockReturnValue(keyColumn);
    asMock(getPickerLabelColumn).mockReturnValue(labelColumn);
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
      },
    ],
  ])(
    'should return a function that deserializes a row into a normalized picker item data object: %s',
    (_label, keyValue, labelValue, givenFormatValue, expected) => {
      asMock(row.get).mockImplementation((column: dh.Column) =>
        column === keyColumn ? keyValue : labelValue
      );

      const { result } = renderHook(() =>
        usePickerItemRowDeserializer({
          table,
          keyColumnName,
          labelColumnName,
          formatValue: givenFormatValue,
        })
      );

      expect(getPickerKeyColumn).toHaveBeenCalledWith(table, keyColumnName);
      expect(getPickerLabelColumn).toHaveBeenCalledWith(
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
