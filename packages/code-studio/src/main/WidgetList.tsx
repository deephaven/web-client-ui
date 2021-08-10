// Displays a list of widgets, table, plot, and widget(not yet implemented)) from a persistent query
import React, {
  ChangeEvent,
  MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { SearchInput } from '@deephaven/components';
import { ObjectIcon } from '@deephaven/console';

const MINIMUM_DRAG_DISTANCE = 10;

export type WidgetDefinition = {
  name: string;
  type: string;
};

export type SelectStartEvent = {
  x: number;
  y: number;
  widget: WidgetDefinition;
};

export interface WidgetListProps {
  onSelect: (widget: WidgetDefinition, e?: _MouseEvent) => undefined;
  onExportLayout: () => undefined;
  onImportLayout: () => undefined;
  widgets?: WidgetDefinition[];
}

export const WidgetList = (props: WidgetListProps): JSX.Element => {
  const { onSelect, widgets = [] } = props;
  const [disableDoubleClick, setDisableDoubleClick] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchField = useRef<SearchInput>(null);
  const selectStartEvent = useRef<SelectStartEvent>();

  /**
   * Send object to be created, if an event is passed object
   * is treated as createDragSourceFromEvent in golden-layout
   * and uses the event as the starting location for the drag.
   * @param {WidgetDefintion} widget
   * @param {_MouseEvent?} event
   */
  const sendSelect = useCallback(
    (widget: WidgetDefinition, event?: _MouseEvent) => {
      if (widget) onSelect(widget, event);
    },
    [onSelect]
  );

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  }, []);

  const handleMouseMove = useCallback(
    (e: _MouseEvent) => {
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
    (e: MouseEvent, widget: WidgetDefinition) => {
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
    (e: MouseEvent, widget: WidgetDefinition) => {
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
        searchText ? widget.name.includes(searchText) : true
      ),
    [searchText, widgets]
  );

  const widgetElements = useMemo(
    () =>
      filteredWidgets.map(widget => (
        <li key={widget.name}>
          <button
            type="button"
            className="btn btn-link"
            data-testid={`panel-list-item-${widget.name}-button`}
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
            <ObjectIcon type={widget.type} /> {widget.name}
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
    <div className="panels-menu-container d-flex flex-column">
      <SearchInput
        value={searchText}
        placeholder="Find Table, Plot or Widget"
        onChange={handleSearchChange}
        ref={searchField}
      />
      <ul className="panels-menu-table-list flex-grow-1">
        {errorElement && (
          <li className="panels-menu-message">{errorElement}</li>
        )}
        {!errorElement && widgetElements}
      </ul>
    </div>
  );
};

export default WidgetList;
