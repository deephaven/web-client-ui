import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose } from '@deephaven/icons';
import React, { ChangeEvent, ReactElement } from 'react';
import { Button } from '@deephaven/components';
import './GotoRow.scss';
import IrisGridTableModel from './IrisGridTableModel';

interface GotoRowProps {
  model: IrisGridTableModel;
  selectedRowNumber: string | undefined;
  onGotoRowNumberChanged: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

const GotoRow = ({
  model,
  selectedRowNumber,
  onGotoRowNumberChanged,
  onClose,
}: GotoRowProps): ReactElement => {
  const res = 'Row number';

  const { table } = model;
  const { size } = table;

  return (
    <div className="goto-row">
      <div className="goto-row-text">
        <h6>Go to row</h6>
      </div>
      <div className="goto-row-input">
        <input
          type="number"
          className="form-control"
          placeholder={res}
          onChange={event => {
            const row = event.target.value;
            if (
              row === '' ||
              (parseInt(row, 10) > 0 && parseInt(row, 10) <= size)
            ) {
              onGotoRowNumberChanged(event);
            }
          }}
          value={selectedRowNumber}
        />
      </div>
      <div className="goto-row-text">
        <h6>of {size}</h6>
      </div>
      <div className="goto-row-close">
        <Button kind="ghost" onClick={onClose}>
          <FontAwesomeIcon icon={vsClose} style={{ marginRight: '0' }} />
        </Button>
      </div>
    </div>
  );
};

export default GotoRow;
