import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose, vsArrowUp, vsArrowDown } from '@deephaven/icons';
import React, {
  ChangeEvent,
  KeyboardEvent,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Column } from '@deephaven/jsapi-shim';
import {
  Type as FilterType,
  TypeValue as FilterTypeValue,
} from '@deephaven/filters';
import { Button, DateTimeInput } from '@deephaven/components';
import { TableUtils } from '@deephaven/jsapi-utils';
import classNames from 'classnames';
import './GotoRow.scss';
import IrisGridModel from './IrisGridModel';
import IrisGridProxyModel from './IrisGridProxyModel';
import IrisGridBottomBar from './IrisGridBottomBar';
import { ColumnName } from './CommonTypes';

export function isIrisGridProxyModel(
  model: IrisGridModel
): model is IrisGridProxyModel {
  return (model as IrisGridProxyModel).model !== undefined;
}

const DEFAULT_FORMAT_STRING = '###,##0';

interface GotoRowProps {
  gotoRow: string;
  gotoRowError: string;
  gotoValueError: string;
  onGotoRowSubmit: () => void;
  model: IrisGridModel;
  onGotoRowNumberChanged: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  isShown: boolean;
  onEntering: () => void;
  onEntered: () => void;
  onExiting: () => void;
  onExited: () => void;

  gotoValueSelectedColumnName: ColumnName;
  gotoValue: string;
  onGotoValueSelectedColumnNameChanged: (columnName: ColumnName) => void;
  onGotoValueSelectedFilterChanged: (filter: FilterTypeValue) => void;
  onGotoValueChanged: (input: string) => void;
  onGotoValueSubmit: (isBackward?: boolean) => void;
}

function GotoRow({
  gotoRow,
  gotoRowError,
  gotoValueError,
  onGotoRowSubmit,
  isShown,
  onEntering,
  onEntered,
  onExiting,
  onExited,
  model,
  onGotoRowNumberChanged,
  onClose,
  gotoValueSelectedColumnName,
  gotoValue,
  onGotoValueSelectedColumnNameChanged,
  onGotoValueSelectedFilterChanged,
  onGotoValueChanged,
  onGotoValueSubmit,
}: GotoRowProps): ReactElement {
  const gotoRowInputRef = useRef<HTMLInputElement>(null);
  const gotoValueInputRef = useRef<HTMLInputElement>(null);

  const [isGotoRowActive, setIsGotoRowActive] = useState(false);
  let columns: Column[] = [];

  if (isIrisGridProxyModel(model) && model.table !== undefined) {
    ({ columns } = model.table);
  }

  const res = 'Row number';

  const { rowCount } = model;
  const handleGotoValueKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      onGotoValueSubmit();
    }
  };

  const index = model.getColumnIndexByName(gotoValueSelectedColumnName);

  const selectedColumn = columns[index ?? 0];

  const columnType = selectedColumn?.type;

  const normalizedType = TableUtils.getNormalizedType(columnType);
  const onGotoValueInputChanged = (value?: string) => {
    onGotoValueChanged(value ?? '');
  };
  const selectInput = () => {
    // when row changes without focus (i.e. via context menu), re-select input
    if (isGotoRowActive && document.activeElement !== gotoRowInputRef.current) {
      gotoRowInputRef.current?.select();
    } else if (
      !isGotoRowActive &&
      document.activeElement !== gotoValueInputRef.current
    ) {
      gotoValueInputRef.current?.select();
    }
  };
  useEffect(selectInput, [isGotoRowActive, gotoRow, gotoValue]);

  const renderValueInput = () => {
    switch (normalizedType) {
      case TableUtils.dataType.DECIMAL:
      case TableUtils.dataType.INT:
        return (
          <div className="goto-row-input">
            <input
              ref={gotoValueInputRef}
              type="number"
              className={classNames('form-control', {
                'is-invalid': gotoValueError !== '',
              })}
              onKeyDown={handleGotoValueKeyDown}
              placeholder="value"
              onChange={e => onGotoValueInputChanged(e.target.value)}
              value={gotoValue}
            />
          </div>
        );
      case TableUtils.dataType.DATETIME:
        return (
          <div className="goto-value-date-time-input">
            <DateTimeInput
              className={classNames(
                'form-control',
                'goto-value-date-time-input',
                {
                  'is-invalid': gotoValueError !== '',
                }
              )}
              onChange={onGotoValueInputChanged}
            />
          </div>
        );
      case TableUtils.dataType.STRING:
        return (
          <>
            <div className="goto-row-input">
              <select
                className="custom-select"
                onChange={event => {
                  onGotoValueSelectedFilterChanged(
                    event.target.value as FilterTypeValue
                  );
                }}
              >
                <option key={FilterType.eq} value={FilterType.eq}>
                  Equals
                </option>
                <option key={FilterType.contains} value={FilterType.contains}>
                  Contains
                </option>
                <option
                  key={FilterType.eqIgnoreCase}
                  value={FilterType.eqIgnoreCase}
                >
                  EqIgnoreCase
                </option>
              </select>
            </div>
            <div className="goto-row-input">
              <input
                ref={gotoValueInputRef}
                className={classNames('form-control', {
                  'is-invalid': gotoValueError !== '',
                })}
                onKeyDown={handleGotoValueKeyDown}
                placeholder="value"
                onChange={e => onGotoValueInputChanged(e.target.value)}
                value={gotoValue}
              />
            </div>
          </>
        );
      case TableUtils.dataType.BOOLEAN:
        return (
          <div className="goto-row-input">
            <select
              className="custom-select"
              onChange={event => {
                onGotoValueInputChanged(event.target.value);
              }}
              value={gotoValue}
            >
              <option key="true" value="true">
                true
              </option>
              <option key="false" value="false">
                false
              </option>
            </select>
          </div>
        );
      default:
        return (
          <div className="goto-row-input">
            <input
              ref={gotoValueInputRef}
              className="form-control"
              onKeyDown={handleGotoValueKeyDown}
              placeholder="value"
              onChange={e => onGotoValueInputChanged(e.target.value)}
              value={gotoValue}
            />
          </div>
        );
    }
  };
  return (
    <IrisGridBottomBar
      isShown={isShown}
      className={classNames('goto-row')}
      onEntering={onEntering}
      onEntered={() => {
        onEntered();
        selectInput();
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
            onFocus={() => setIsGotoRowActive(true)}
            role="group"
          >
            <div className="goto-row-text">Go to row</div>
            <div className="goto-row-input">
              <input
                ref={gotoRowInputRef}
                type="number"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    e.preventDefault();
                    onGotoRowSubmit();
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
            {gotoRowError && <div className="text-danger">{gotoRowError}</div>}
          </div>
          <div className="goto-row-close">
            <Button kind="ghost" onClick={onClose}>
              <FontAwesomeIcon icon={vsClose} style={{ marginRight: '0' }} />
            </Button>
          </div>
        </div>
        {model.isSeekRowAvailable && (
          <div className="goto-row-row">
            <div
              className={classNames('goto-row-wrapper', {
                'is-inactive': isGotoRowActive,
              })}
              onClick={() => setIsGotoRowActive(false)}
              onFocus={() => setIsGotoRowActive(false)}
              role="group"
            >
              <div className="goto-row-text">Go to value</div>
              <div className="goto-row-input">
                <select
                  className="custom-select"
                  onChange={event => {
                    const columnName = event.target.value;
                    onGotoValueSelectedColumnNameChanged(columnName);
                  }}
                  value={gotoValueSelectedColumnName}
                >
                  {columns.map(column => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </div>

              {renderValueInput()}

              <div>
                <Button
                  kind="ghost"
                  disabled={gotoValue === ''}
                  onClick={() => {
                    onGotoValueSubmit(true);
                  }}
                >
                  <FontAwesomeIcon icon={vsArrowUp} />
                </Button>
                <Button
                  kind="ghost"
                  disabled={gotoValue === ''}
                  onClick={() => {
                    onGotoValueSubmit(false);
                  }}
                >
                  <FontAwesomeIcon icon={vsArrowDown} />
                </Button>
              </div>
              {gotoValueError && (
                <div className="text-danger">{gotoValueError}</div>
              )}
            </div>
          </div>
        )}
      </>
    </IrisGridBottomBar>
  );
}

export default GotoRow;
