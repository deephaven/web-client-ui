import React, {
  ChangeEvent,
  MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button, SearchInput } from '@deephaven/components';
import { ObjectIcon } from '@deephaven/console';
import {
  vsArrowSmallDown,
  vsArrowSmallUp,
  vsPreview,
  vsRefresh,
} from '@deephaven/icons';
import { VariableDefinition } from '@deephaven/jsapi-shim';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './WidgetList.scss';

const MINIMUM_DRAG_DISTANCE = 10;

// When we're listening on the window, it emits a `globalThis.MouseEvent`
// `WindowMouseEvent` is just a convenience alias
export type WindowMouseEvent = globalThis.MouseEvent;

export type SelectStartEvent = {
  x: number;
  y: number;
  widget: VariableDefinition;
};

export interface WidgetListProps {
  onSelect: (widget: VariableDefinition, e?: WindowMouseEvent) => undefined;
  onExportLayout: () => undefined;
  onImportLayout: () => undefined;
  onResetLayout: () => undefined;
  widgets?: VariableDefinition[];
}

/**
 * Display a search field and a list of widgets, as well as layout export/import buttons.
 * @param props The widgets and handlers to use for this list
 * @returns A JSX element for the list of widgets, along with search
 */
export const WidgetList = (props: WidgetListProps): JSX.Element => {
  const {
    onExportLayout,
    onImportLayout,
    onResetLayout,
    onSelect,
    widgets = [],
  } = props;
  const [disableDoubleClick, setDisableDoubleClick] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchField = useRef<SearchInput>(null);
  const selectStartEvent = useRef<SelectStartEvent>();

  /**
   * Send object to be created, if an event is passed object
   * is treated as createDragSourceFromEvent in golden-layout
   * and uses the event as the starting location for the drag.
   * @param {WidgetDefintion} widget
   * @param {WindowMouseEvent?} event
   */
  const sendSelect = useCallback(
    (widget: VariableDefinition, event?: WindowMouseEvent) => {
      if (widget) onSelect(widget, event);
    },
    [onSelect]
  );

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  }, []);

  const handleMouseMove = useCallback(
    (e: WindowMouseEvent) => {
      if (selectStartEvent.current == null) {
        return;
      }

      if (
        Math.abs(selectStartEvent.current.x - e.clientX) >=
          MINIMUM_DRAG_DISTANCE ||
        Math.abs(selectStartEvent.current.y - e.clientY) >=
          MINIMUM_DRAG_DISTANCE
      ) {
        setDisableDoubleClick(true);
        window.removeEventListener('mousemove', handleMouseMove);
        sendSelect(selectStartEvent.current.widget, e);
        selectStartEvent.current = undefined; // unset so mouseUp can't fire
      }
    },
    [selectStartEvent, sendSelect]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent, widget: VariableDefinition) => {
      selectStartEvent.current = {
        x: e.clientX,
        y: e.clientY,
        widget,
      };
      window.addEventListener('mousemove', handleMouseMove);
    },
    [handleMouseMove]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent, widget: VariableDefinition) => {
      window.removeEventListener('mousemove', handleMouseMove);

      // down and up need to occur on same object to constitute a click event
      if (selectStartEvent.current?.widget === widget) {
        setDisableDoubleClick(true);
        sendSelect(widget);
      }
      selectStartEvent.current = undefined;
    },
    [handleMouseMove, selectStartEvent, sendSelect]
  );

  const filteredWidgets = useMemo(
    () =>
      widgets.filter(widget =>
        searchText
          ? widget.name?.toLowerCase().includes(searchText.toLowerCase())
          : true
      ),
    [searchText, widgets]
  ).sort((a, b) => a.name?.localeCompare(b.name ?? '') ?? 0);

  const widgetElements = useMemo(
    () =>
      filteredWidgets.map(widget => (
        <li key={widget.name}>
          <button
            type="button"
            className="btn btn-link"
            data-testid={`panel-list-item-${widget.name ?? ''}-button`}
            onMouseDown={event => {
              handleMouseDown(event, widget);
            }}
            onMouseUp={event => {
              handleMouseUp(event, widget);
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                sendSelect(widget);
              }
            }}
            disabled={disableDoubleClick}
          >
            <ObjectIcon type={widget.type} /> {widget.name ?? ''}
          </button>
        </li>
      )),
    [
      filteredWidgets,
      disableDoubleClick,
      handleMouseDown,
      handleMouseUp,
      sendSelect,
    ]
  );

  const errorElement = useMemo(
    () =>
      widgetElements.length === 0 ? (
        <span>No bound variables found.</span>
      ) : null,
    [widgetElements]
  );

  return (
    <div className="widget-list-container d-flex flex-column">
      <div className="widget-list-header">
        <SearchInput
          value={searchText}
          placeholder="Find Table, Plot or Widget"
          onChange={handleSearchChange}
          ref={searchField}
        />
      </div>
      <ul className="widget-list flex-grow-1">
        {errorElement && (
          <li className="widget-list-message">{errorElement}</li>
        )}
        {!errorElement && widgetElements}
      </ul>
      <div>
        <hr />
      </div>
      <div className="widget-list-footer">
        <Button kind="ghost" onClick={onExportLayout}>
          <div className="fa-md fa-layers">
            <FontAwesomeIcon
              mask={vsPreview}
              icon={vsArrowSmallDown}
              transform="right-5 down-5"
            />
            <FontAwesomeIcon
              icon={vsArrowSmallDown}
              transform="right-8 down-6"
            />
          </div>
          Export Layout
        </Button>
        <Button kind="ghost" onClick={onImportLayout}>
          <div className="fa-md fa-layers">
            <FontAwesomeIcon
              mask={vsPreview}
              icon={vsArrowSmallUp}
              transform="right-5 down-5"
            />
            <FontAwesomeIcon icon={vsArrowSmallUp} transform="right-8 down-6" />
          </div>
          Import Layout
        </Button>
        <Button
          kind="ghost"
          icon={vsRefresh}
          onClick={onResetLayout}
          tooltip="Reset Layout"
        />
      </div>
    </div>
  );
};

export default WidgetList;
