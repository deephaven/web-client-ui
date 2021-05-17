import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DropdownMenu, SearchInput, Tooltip } from '@deephaven/components';
import {
  dhTable,
  vsGraph,
  vsKebabVertical,
  vsTriangleDown,
} from '@deephaven/icons';
import Log from '@deephaven/log';
import { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import memoize from 'memoize-one';
import './ConsoleMenu.scss';
import ConsoleUtils from './common/ConsoleUtils';

const log = Log.module('ConsoleMenu');

class ConsoleMenu extends PureComponent {
  static makeItemActions(
    objects,
    filterText,
    refCallback,
    changeCallback,
    openCallback
  ) {
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
        ({ name }) => name.toLowerCase().indexOf(filterText.toLowerCase()) >= 0
      );
    }
    const openActions = filteredItems.map(object => ({
      title: object.name,
      action: () => {
        openCallback(object);
      },
    }));

    return [searchAction, ...openActions];
  }

  constructor(props) {
    super(props);

    this.handleTableFilterChange = this.handleTableFilterChange.bind(this);
    this.handleTableMenuClosed = this.handleTableMenuClosed.bind(this);
    this.handleTableMenuOpened = this.handleTableMenuOpened.bind(this);
    this.handleWidgetFilterChange = this.handleWidgetFilterChange.bind(this);
    this.handleWidgetMenuClosed = this.handleWidgetMenuClosed.bind(this);
    this.handleWidgetMenuOpened = this.handleWidgetMenuOpened.bind(this);

    this.tableSearchField = null;
    this.widgetSearchField = null;

    this.state = {
      tableFilterText: '',
      widgetFilterText: '',
    };
  }

  makeTableActions = memoize((objects, filterText, openObject) => {
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
  });

  makeWidgetActions = memoize((objects, filterText, openObject) => {
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
  });

  handleTableFilterChange(e) {
    log.debug('filtering tables...');
    this.setState({ tableFilterText: e.target.value });
  }

  handleTableMenuClosed() {
    this.setState({ tableFilterText: '' });
  }

  handleTableMenuOpened() {
    if (this.tableSearchField && this.tableSearchField.focus) {
      this.tableSearchField.focus();
    }
  }

  handleWidgetFilterChange(e) {
    log.debug('filtering widgets...');
    this.setState({ widgetFilterText: e.target.value });
  }

  handleWidgetMenuClosed() {
    this.setState({ widgetFilterText: '' });
  }

  handleWidgetMenuOpened() {
    if (this.widgetSearchField && this.widgetSearchField.focus) {
      this.widgetSearchField.focus();
    }
  }

  render() {
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
    const popperOptions = { placement: 'bottom-end' };

    return (
      <div className="console-pane-menu">
        <button
          type="button"
          className="btn btn-link btn-link-icon"
          disabled={tableActions.length === 0}
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
        </button>
        <button
          type="button"
          className="btn btn-link btn-link-icon"
          disabled={widgetActions.length === 0}
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
        </button>
        <button
          type="button"
          className="btn btn-link btn-overflow btn-link-icon"
        >
          <FontAwesomeIcon icon={vsKebabVertical} />
          <Tooltip>More Actions...</Tooltip>
          <DropdownMenu
            actions={overflowActions}
            popperOptions={popperOptions}
          />
        </button>
      </div>
    );
  }
}

ConsoleMenu.propTypes = {
  openObject: PropTypes.func.isRequired,
  objects: PropTypes.arrayOf(APIPropTypes.VariableDefinition).isRequired,
  overflowActions: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.arrayOf(PropTypes.shape({})),
  ]).isRequired,
};

export default ConsoleMenu;
