import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhPandas, dhTable, vsGraph, vsPreview } from '@deephaven/icons';
import dh from '@deephaven/jsapi-shim';

export type ObjectIconProps = {
  type: string;
};

const ObjectIcon = ({ type }: ObjectIconProps): JSX.Element => {
  switch (type) {
    case dh.VariableType.TABLE:
    case dh.VariableType.TABLEMAP:
    case dh.VariableType.TREETABLE:
      return <FontAwesomeIcon icon={dhTable} />;
    case dh.VariableType.FIGURE:
      return <FontAwesomeIcon icon={vsGraph} />;
    case dh.VariableType.PANDAS:
      return <FontAwesomeIcon icon={dhPandas} />;
    default:
      return <FontAwesomeIcon icon={vsPreview} />;
  }
};

export default ObjectIcon;
