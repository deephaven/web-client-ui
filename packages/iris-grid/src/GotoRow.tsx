import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose } from '@deephaven/icons';
import React, {
  ChangeEvent,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Column } from '@deephaven/jsapi-shim';
import { Button } from '@deephaven/components';
import classNames from 'classnames';
import './GotoRow.scss';
import IrisGridModel from './IrisGridModel';
import IrisGridProxyModel from './IrisGridProxyModel';
import IrisGridBottomBar from './IrisGridBottomBar';
import { isIrisGridTableModelTemplate } from './IrisGridTableModelTemplate';

export function isIrisGridProxyModel(
  model: IrisGridModel
): model is IrisGridProxyModel {
  return (model as IrisGridProxyModel).model !== undefined;
}

const DEFAULT_FORMAT_STRING = '###,##0';

interface GotoRowProps {
  gotoRow: string;
  gotoRowError: string;
  onSubmit: () => void;
  model: IrisGridModel;
  onGotoRowNumberChanged: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  isShown: boolean;
  onEntering: () => void;
  onEntered: () => void;
  onExiting: () => void;
  onExited: () => void;
}

const GotoRow = ({
  gotoRow,
  gotoRowError,
  onSubmit,
  isShown,
  onEntering,
  onEntered,
  onExiting,
  onExited,
  model,
  onGotoRowNumberChanged,
  onClose,
}: GotoRowProps): ReactElement => {
  const [strColumns, setStrColumns] = useState<Column[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<Column>();
  const [gotoValueInput, setGotoValueInput] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isIrisGridTableModelTemplate(model)) {
      const { table } = model;
      const columns = table?.columns;

      const stringColumns: Column[] = [];

      for (let i = 0; i < columns.length; i += 1) {
        const column = columns?.[i];
        if (column !== undefined && column.type === 'java.lang.String') {
          stringColumns.push(column);
        }
      }
      setStrColumns(stringColumns);
      setSelectedColumn(stringColumns[0]);
    }
  }, [model]);

  const seekRow = async () => {
    if (isIrisGridTableModelTemplate(model) && selectedColumn !== undefined) {
      console.log('seek');
      const { table } = model;
      let { seekRow: seekRowFunction } = table;
      seekRowFunction = seekRowFunction.bind(table);
      console.log(selectedColumn);
      console.log(gotoValueInput);
      const row = await table.seekRow(
        0,
        selectedColumn,
        'String',
        gotoValueInput
      );
      console.log('row', row);
    }
  };

  const res = 'Row number';

  const { rowCount } = model;

  useEffect(() => {
    // when row changes without focus (i.e. via context menu), re-select input
    if (document.activeElement !== inputRef.current) {
      inputRef.current?.select();
    }
  }, [gotoRow]);

  return (
    <IrisGridBottomBar
      isShown={isShown}
      className={classNames('goto-row')}
      onEntering={onEntering}
      onEntered={() => {
        onEntered();
        inputRef.current?.select();
      }}
      onExiting={onExiting}
      onExited={onExited}
    >
      <div style={{ width: '100%' }}>
        <div style={{ display: 'inline-block' }}>
          <div className="goto-row-wrapper">
            <div className="goto-row-text">Go to row</div>
            <div className="goto-row-input">
              <input
                ref={inputRef}
                type="number"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                className={classNames('form-control', {
                  'is-invalid': gotoRowError !== '',
                })}
                placeholder={res}
                onChange={event => {
                  onGotoRowNumberChanged(event);
                }}
                value={gotoRow}
              />
            </div>
            <div className="goto-row-text">
              of {dh.i18n.NumberFormat.format(DEFAULT_FORMAT_STRING, rowCount)}
            </div>
            {gotoRowError && (
              <div className="goto-row-error text-danger">{gotoRowError}</div>
            )}
          </div>
          <span className="goto-row-close">
            <Button kind="ghost" onClick={onClose}>
              <FontAwesomeIcon icon={vsClose} style={{ marginRight: '0' }} />
            </Button>
          </span>
        </div>
        {isIrisGridTableModelTemplate(model) && (
          <div className="goto-row-text">
            <div className="goto-row-text">Go to value</div>
            <div className="goto-row-input">
              <select
                className="custom-select"
                onChange={event => {
                  setSelectedColumn(
                    strColumns[parseInt(event.target.value, 10)]
                  );
                }}
              >
                {strColumns.map((column, index) => (
                  <option key={column.index} value={index}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="goto-row-input">
              <input
                ref={inputRef}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    e.preventDefault();
                    seekRow();
                  }
                }}
                placeholder="value"
                onChange={event => {
                  setGotoValueInput(event.target.value);
                  seekRow();
                }}
                value={gotoValueInput}
              />
            </div>
          </div>
        )}
      </div>
    </IrisGridBottomBar>
  );
};

export default GotoRow;
