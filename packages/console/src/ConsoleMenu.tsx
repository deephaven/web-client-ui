import React, {
  ChangeEvent,
  ChangeEventHandler,
  PureComponent,
  ReactElement,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  DropdownAction,
  DropdownMenu,
  PopperOptions,
  SearchInput,
  Tooltip,
} from '@deephaven/components';
import {
  dhTable,
  vsGraph,
  vsKebabVertical,
  vsTriangleDown,
} from '@deephaven/icons';
import Log from '@deephaven/log';
import { VariableDefinition } from '@deephaven/jsapi-shim';
import memoize from 'memoize-one';
import './ConsoleMenu.scss';
import ConsoleUtils from './common/ConsoleUtils';

const log = Log.module('ConsoleMenu');

interface ConsoleMenuProps {
  openObject: (object: VariableDefinition) => void;
  objects: VariableDefinition[];
  overflowActions: () => DropdownAction[];
}

interface ConsoleMenuState {
  tableFilterText: string;
  widgetFilterText: string;
}

class ConsoleMenu extends PureComponent<ConsoleMenuProps, ConsoleMenuState> {
  static makeItemActions(
    objects: VariableDefinition[],
    filterText: string,
    refCallback: (ref: SearchInput) => void,
    changeCallback: ChangeEventHandler<HTMLInputElement>,
    openCallback: (object: VariableDefinition) => void
  ): DropdownAction[] {
    if (objects.length === 0) {
      return [];
    }

    const searchAction = {
      menuElement: (
        <SearchInput
          value={filterText}
          onChange={changeCallback}
          className="console-menu"
          ref={refCallback}
        />
      ),
    };
    let filteredItems = objects;
    if (filterText) {
      filteredItems = filteredItems.filter(
        ({ title }: { title?: string }) =>
          title != null &&
          title.toLowerCase().indexOf(filterText.toLowerCase()) >= 0
      );
    }
    const openActions = filteredItems.map(object => ({
      title: object.title,
      action: () => {
        openCallback(object);
      },
    }));

    return [searchAction, ...openActions];
  }

  constructor(props: ConsoleMenuProps) {
    super(props);

    this.handleTableFilterChange = this.handleTableFilterChange.bind(this);
    this.handleTableMenuClosed = this.handleTableMenuClosed.bind(this);
    this.handleTableMenuOpened = this.handleTableMenuOpened.bind(this);
    this.handleWidgetFilterChange = this.handleWidgetFilterChange.bind(this);
    this.handleWidgetMenuClosed = this.handleWidgetMenuClosed.bind(this);
    this.handleWidgetMenuOpened = this.handleWidgetMenuOpened.bind(this);

    this.state = {
      tableFilterText: '',
      widgetFilterText: '',
    };
  }

  tableSearchField?: SearchInput;

  widgetSearchField?: SearchInput;

  makeTableActions = memoize(
    (
      objects: VariableDefinition[],
      filterText: string,
      openObject: (object: VariableDefinition) => void
    ): DropdownAction[] => {
      const tables = objects.filter(object =>
        ConsoleUtils.isTableType(object.type)
      );
      return ConsoleMenu.makeItemActions(
        tables,
        filterText,
        searchField => {
          this.tableSearchField = searchField;
        },
        this.handleTableFilterChange,
        openObject
      );
    }
  );

  makeWidgetActions = memoize(
    (
      objects: VariableDefinition[],
      filterText: string,
      openObject: (object: VariableDefinition) => void
    ): DropdownAction[] => {
      const widgets = objects.filter(object =>
        ConsoleUtils.isWidgetType(object.type)
      );
      return ConsoleMenu.makeItemActions(
        widgets,
        filterText,
        searchField => {
          this.widgetSearchField = searchField;
        },
        this.handleWidgetFilterChange,
        openObject
      );
    }
  );

  handleTableFilterChange(e: ChangeEvent<HTMLInputElement>): void {
    log.debug('filtering tables...');
    this.setState({ tableFilterText: e.target.value });
  }

  handleTableMenuClosed(): void {
    this.setState({ tableFilterText: '' });
  }

  handleTableMenuOpened(): void {
    this.tableSearchField?.focus();
  }

  handleWidgetFilterChange(e: ChangeEvent<HTMLInputElement>): void {
    log.debug('filtering widgets...');
    this.setState({ widgetFilterText: e.target.value });
  }

  handleWidgetMenuClosed(): void {
    this.setState({ widgetFilterText: '' });
  }

  handleWidgetMenuOpened(): void {
    this.widgetSearchField?.focus();
  }

  render(): ReactElement {
    const { overflowActions, objects, openObject } = this.props;
    const { tableFilterText, widgetFilterText } = this.state;
    const tableActions = this.makeTableActions(
      objects,
      tableFilterText,
      openObject
    );
    const widgetActions = this.makeWidgetActions(
      objects,
      widgetFilterText,
      openObject
    );
    const popperOptions: PopperOptions = { placement: 'bottom-end' };

    return (
      <div className="console-pane-menu">
        <Button
          kind="ghost"
          className="btn-link-icon"
          disabled={tableActions.length === 0}
          onClick={() => {
            // no-op: click is handled in `DropdownMenu`
          }}
        >
          <div className="fa-md fa-layers">
            <FontAwesomeIcon
              mask={dhTable}
              icon={vsTriangleDown}
              transform="right-5 down-5"
            />
            <FontAwesomeIcon icon={vsTriangleDown} transform="right-8 down-6" />
          </div>
          <Tooltip>Tables</Tooltip>
          <DropdownMenu
            key="table-actions "
            actions={tableActions}
            onMenuOpened={this.handleTableMenuOpened}
            onMenuClosed={this.handleTableMenuClosed}
            options={{ initialKeyboardIndex: 1 }}
            popperOptions={popperOptions}
          />
        </Button>
        <Button
          kind="ghost"
          className="btn-link-icon"
          disabled={widgetActions.length === 0}
          onClick={() => {
            // no-op: click is handled in `DropdownMenu'
          }}
        >
          <div className="fa-md fa-layers">
            <FontAwesomeIcon
              mask={vsGraph}
              icon={vsTriangleDown}
              transform="right-5 down-5"
            />
            <FontAwesomeIcon icon={vsTriangleDown} transform="right-8 down-6" />
          </div>
          <Tooltip>Widgets</Tooltip>
          <DropdownMenu
            key="table-actions"
            actions={widgetActions}
            onMenuOpened={this.handleWidgetMenuOpened}
            onMenuClosed={this.handleWidgetMenuClosed}
            options={{ initialKeyboardIndex: 1 }}
            popperOptions={popperOptions}
          />
        </Button>
        <Button
          kind="ghost"
          className="btn-overflow btn-link-icon"
          icon={vsKebabVertical}
          tooltip="More Actions..."
          onClick={() => {
            // no-op: click is handled in `DropdownMenu`
          }}
        >
          <DropdownMenu
            actions={overflowActions}
            popperOptions={popperOptions}
          />
        </Button>
      </div>
    );
  }
}

export default ConsoleMenu;
