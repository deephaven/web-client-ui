import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhTable, vsGraph, vsPreview } from '@deephaven/icons';
import dh from '@deephaven/jsapi-shim';
import { ReactComponent as PandasIcon } from '../../assets/svg/pandas_mark_white_tiny.svg';

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
      return <PandasIcon className="svg-inline--fa fa-w-16" />;
    default:
      return <FontAwesomeIcon icon={vsPreview} />;
  }
};

export default ObjectIcon;
