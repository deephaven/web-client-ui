import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhPandas, dhTable, vsGraph, vsPreview } from '@deephaven/icons';
import { dhType } from '@deephaven/jsapi-shim';

export type ObjectIconProps = {
  dh: dhType;
  type: string;
};

function ObjectIcon({ type, dh }: ObjectIconProps): JSX.Element {
  const { VariableType } = dh;
  switch (type) {
    case VariableType.TABLE:
    case VariableType.TABLEMAP:
    case VariableType.TREETABLE:
    case VariableType.HIERARCHICALTABLE:
      return <FontAwesomeIcon icon={dhTable} />;
    case VariableType.FIGURE:
      return <FontAwesomeIcon icon={vsGraph} />;
    case VariableType.PANDAS:
      return <FontAwesomeIcon icon={dhPandas} />;
    default:
      return <FontAwesomeIcon icon={vsPreview} />;
  }
}

export default ObjectIcon;
