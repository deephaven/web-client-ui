import React, { ReactElement } from 'react';
import { TableUtils } from '@deephaven/jsapi-utils';

const columnTypesArray = [
  { value: TableUtils.dataType.DATETIME, label: 'DateTime' },
  { value: TableUtils.dataType.DECIMAL, label: 'Decimal' },
  { value: TableUtils.dataType.INT, label: 'Integer' },
];

export default function ColumnTypeOptions(): ReactElement {
  const columnTypeOptions = columnTypesArray.map(item => (
    <option key={`key-columnType-${item.value}`} value={item.value}>
      {item.label}
    </option>
  ));

  return (
    <>
      <option key="key-columnType-placeholder" disabled value="">
        Select Type
      </option>
      {columnTypeOptions}
    </>
  );
}
