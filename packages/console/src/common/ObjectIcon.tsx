import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhPandas, dhTable, vsGraph, vsPreview } from '@deephaven/icons';
import { useApi } from '@deephaven/jsapi-bootstrap';

export type ObjectIconProps = {
  type: string;
};

function ObjectIcon({ type }: ObjectIconProps): JSX.Element {
  const dh = useApi();
  switch (type) {
    case dh.VariableType.TABLE:
    case dh.VariableType.TABLEMAP:
    case dh.VariableType.TREETABLE:
    case dh.VariableType.HIERARCHICALTABLE:
    case dh.VariableType.PARTITIONEDTABLE:
      return <FontAwesomeIcon icon={dhTable} />;
    case dh.VariableType.FIGURE:
      return <FontAwesomeIcon icon={vsGraph} />;
    case dh.VariableType.PANDAS:
      return <FontAwesomeIcon icon={dhPandas} />;
    default:
      return <FontAwesomeIcon icon={vsPreview} />;
  }
}

export default ObjectIcon;
