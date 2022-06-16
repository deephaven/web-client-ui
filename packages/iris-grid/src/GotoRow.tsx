import { ModelIndex } from '@deephaven/grid';
import React, { ChangeEvent, ReactElement, useState } from 'react';
import IrisGridModel from './IrisGridModel';
import './GotoRow.scss';

interface GotoRowProps {
  cellInfo: { row: ModelIndex | null; column: ModelIndex | null };
  model: IrisGridModel;
  selectedRowNumber: string | undefined;
  onGotoRowNumberChanged: (event: ChangeEvent<HTMLInputElement>) => void;
}

const GotoRow = ({
  cellInfo: { row, column },
  model,
  selectedRowNumber,
  onGotoRowNumberChanged,
}: GotoRowProps): ReactElement => {
  const res = 'Row Number';

  return (
    <div>
      <div className="goto-row-top-row">
        <h6>Go To Row</h6>
        <input
          type="text"
          className="form-control"
          placeholder={res}
          onChange={onGotoRowNumberChanged}
          value={selectedRowNumber}
        />
      </div>
    </div>
  );
};

export default GotoRow;
