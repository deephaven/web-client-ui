import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose, vsArrowUp, vsArrowDown } from '@deephaven/icons';
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

  gotoValueSelectedColumn?: Column;
  gotoValueSelectedFilter: number;
  gotoValue: string;
  onGotoValueSelectedColumnChanged: (column: Column) => void;
  onGotoValueSelectedFilterChanged: (filter: number) => void;
  onGotoValueChanged: (input: string, isBackward?: boolean) => void;
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
  gotoValueSelectedColumn,
  gotoValueSelectedFilter,
  gotoValue,
  onGotoValueSelectedColumnChanged,
  onGotoValueSelectedFilterChanged,
  onGotoValueChanged,
}: GotoRowProps): ReactElement => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isGotoRowActive, setIsGotoRowActive] = useState(true);
  let columns: Column[] = [];

  if (isIrisGridProxyModel(model) && model.table !== undefined) {
    ({ columns } = model.table);
  }

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
      <>
        <div className="goto-row-row">
          <div
            className={classNames('goto-row-wrapper', {
              'is-inactive': !isGotoRowActive,
            })}
            onClick={() => setIsGotoRowActive(true)}
            role="group"
          >
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
          <div className="goto-row-close">
            <Button kind="ghost" onClick={onClose}>
              <FontAwesomeIcon icon={vsClose} style={{ marginRight: '0' }} />
            </Button>
          </div>
        </div>
        {isIrisGridTableModelTemplate(model) && (
          <div className="goto-row-row">
            <div
              className={classNames('goto-row-wrapper', {
                'is-inactive': isGotoRowActive,
              })}
              onClick={() => setIsGotoRowActive(false)}
              role="group"
            >
              <div className="goto-row-text">Go to value</div>
              <div className="goto-row-input">
                <select
                  className="custom-select"
                  onChange={event => {
                    onGotoValueSelectedColumnChanged(
                      columns[parseInt(event.target.value, 10)]
                    );
                  }}
                >
                  {columns.map((column, index) => (
                    <option key={column.index} value={index}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </div>
              {gotoValueSelectedColumn !== undefined &&
                gotoValueSelectedColumn.type === 'java.lang.String' && (
                  <div className="goto-row-input">
                    <select
                      className="custom-select"
                      onChange={event => {
                        onGotoValueSelectedFilterChanged(
                          event.target.value === 'Equals' ? 0 : 1
                        );
                      }}
                    >
                      {['Equals', 'Contains'].map(filter => (
                        <option key={filter} value={filter}>
                          {filter}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              <div className="goto-row-input">
                <input
                  className="form-control"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      e.preventDefault();
                      onGotoValueChanged(gotoValue);
                    }
                  }}
                  placeholder="value"
                  onChange={event => {
                    onGotoValueChanged(event.target.value);
                  }}
                  value={gotoValue}
                />
              </div>
              {gotoValue !== '' && (
                <div>
                  <Button
                    kind="ghost"
                    onClick={() => {
                      onGotoValueChanged(gotoValue, true);
                    }}
                  >
                    <FontAwesomeIcon icon={vsArrowUp} />
                  </Button>
                  <Button
                    kind="ghost"
                    onClick={() => {
                      onGotoValueChanged(gotoValue, false);
                    }}
                  >
                    <FontAwesomeIcon icon={vsArrowDown} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    </IrisGridBottomBar>
  );
};

export default GotoRow;
