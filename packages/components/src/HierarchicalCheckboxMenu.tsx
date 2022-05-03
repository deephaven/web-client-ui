import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhSort, IconDefinition } from '@deephaven/icons';
import classNames from 'classnames';
import Checkbox from './Checkbox';
import Popper from './popper/Popper';
import './HierarchicalCheckboxMenu.scss';

type HierarchicalCheckboxValueMap = Map<string, boolean | Map<string, boolean>>;

type HierarchicalCheckboxMenuProps = {
  className: string;
  menuText: string;
  valueMap: HierarchicalCheckboxValueMap;
  onUpdateValueMap(map: HierarchicalCheckboxValueMap): void;
  icon: IconDefinition | null;
  id: string;
  'data-testid'?: string;
};

type HierarchicalCheckboxMenuState = {
  menuIsOpen: boolean;
};

/**
 * A pull down menu that displays a hierarchy of checkboxes.
 *
 * Currently supports only two levels of check boxes. The input should be a Map
 * where the keys are the parent names. The values can a boolean if the parent
 * has no children or another Map where keys are child names and values are booleans.
 *
 * Here is an example:
 * const INITIAL_TYPE_MAP = new Map([
 * ['Queries', new Map([['Live', true], ['Batch', true]])],
 * [
 *   'DBA Queries',
 *   new Map([
 *     ['Data Merge', true],
 *     ['Data Validation', true],
 *     ['Imports', true],
 *     ['Data Services', true],
 *   ]),
 * ],
 * ['Helper Queries', true],
 * ]);
 *
 * When a checkbox is changed, this component will make a deep copy of the Map
 * with the appropriate booleans changed. It will then call onUpdateValueMap
 * with the new Map.
 */
class HierarchicalCheckboxMenu extends Component<
  HierarchicalCheckboxMenuProps,
  HierarchicalCheckboxMenuState
> {
  static defaultProps: Partial<HierarchicalCheckboxMenuProps> = {
    className: '',
    icon: null,
    id: '',
    'data-testid': undefined,
  };

  static isParentSelected(
    parent: string,
    valueMap: HierarchicalCheckboxValueMap
  ): boolean | null {
    const children = valueMap.get(parent);
    if (children === undefined) {
      return false;
    }
    if (typeof children === 'boolean') {
      // This parent has no children
      return children;
    }
    const includesTrue = Array.from(children.values()).includes(true);
    const includesFalse = Array.from(children.values()).includes(false);
    if (includesTrue && includesFalse) {
      // Indeterminate
      return null;
    }
    return includesTrue;
  }

  constructor(props: HierarchicalCheckboxMenuProps) {
    super(props);

    this.toggleMenu = this.toggleMenu.bind(this);
    this.toggleValueFor = this.toggleValueFor.bind(this);
    this.selectAll = this.selectAll.bind(this);
    this.clear = this.clear.bind(this);

    this.state = {
      menuIsOpen: false,
    };
  }

  toggleMenu(event: React.MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    event.preventDefault();
    this.setState(state => {
      const { menuIsOpen } = state;
      return { menuIsOpen: !menuIsOpen };
    });
  }

  toggleValueFor(parent: string, child?: string): void {
    const { valueMap, onUpdateValueMap } = this.props;

    // Make a deep copy of the Map and toggle the boolean for parent / child
    const map = new Map(valueMap);
    const children = map.get(parent);
    if (children instanceof Map) {
      const newChildren = new Map(children);
      if (child != null) {
        newChildren.set(child, !children.get(child));
      } else {
        const newChildValue = !HierarchicalCheckboxMenu.isParentSelected(
          parent,
          map
        );
        children.forEach((_, key) => newChildren.set(key, newChildValue));
      }
      map.set(parent, newChildren);
    } else {
      map.set(parent, !children);
    }

    // The parent was clicked so all children must be toggled
    const currentChildren = map.get(parent);
    if (
      child === undefined &&
      currentChildren !== undefined &&
      typeof currentChildren !== 'boolean'
    ) {
      if (HierarchicalCheckboxMenu.isParentSelected(parent, valueMap)) {
        currentChildren.forEach((_, key) => currentChildren.set(key, false));
      } else {
        // for parent selection of false or null (indeterminate), select everything
        currentChildren.forEach((_, key) => currentChildren.set(key, true));
      }
    }

    onUpdateValueMap(map);
  }

  setAllValues(value: boolean): void {
    const { valueMap, onUpdateValueMap } = this.props;

    // Make a deep copy of the Map and set everything
    const copy = new Map();
    valueMap.forEach((child, parent) => {
      if (typeof child === 'boolean') {
        copy.set(parent, value);
      } else {
        const children = new Map();
        child.forEach((_, key) => children.set(key, value));
        copy.set(parent, children);
      }
    });

    onUpdateValueMap(copy);
  }

  selectAll(): void {
    this.setAllValues(true);
  }

  clear(): void {
    this.setAllValues(false);
  }

  renderMenuElement(): React.ReactNode {
    const { valueMap, 'data-testid': dataTestId } = this.props;
    return (
      <div className="hcm-menu-container">
        {Array.from(valueMap.entries()).map(([parent, children]) => (
          <div key={parent}>
            <Checkbox
              className="hcm-parent"
              checked={HierarchicalCheckboxMenu.isParentSelected(
                parent,
                valueMap
              )}
              onChange={() => this.toggleValueFor(parent)}
            >
              {parent}
            </Checkbox>
            {children !== undefined &&
              typeof children !== 'boolean' &&
              Array.from(children.entries()).map(([child, value]) => (
                <Checkbox
                  className="hcm-child"
                  key={child}
                  checked={value}
                  onChange={() => this.toggleValueFor(parent, child)}
                >
                  {child}
                </Checkbox>
              ))}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-link"
          onClick={this.selectAll}
          data-testid={dataTestId ? `${dataTestId}-btn-select-all` : undefined}
        >
          Select All
        </button>
        <button
          type="button"
          className="btn btn-link"
          onClick={this.clear}
          data-testid={dataTestId ? `${dataTestId}-btn-clear` : undefined}
        >
          Clear
        </button>
      </div>
    );
  }

  render(): JSX.Element {
    const {
      menuText,
      className,
      icon,
      id,
      'data-testid': dataTestId,
    } = this.props;
    const { menuIsOpen } = this.state;

    return (
      <button
        type="button"
        className={classNames('btn hcm-btn', className)}
        onClick={this.toggleMenu}
        id={id}
        data-testid={dataTestId}
      >
        <span>
          {icon && <FontAwesomeIcon icon={icon} className="hcm-icon mr-1" />}
          {menuText}
        </span>
        <FontAwesomeIcon icon={dhSort} className="hcm-icon ml-1" />
        <Popper
          options={{ placement: 'bottom' }}
          isShown={menuIsOpen}
          onExited={() => {
            this.setState({ menuIsOpen: false });
          }}
          closeOnBlur
          interactive
        >
          {this.renderMenuElement()}
        </Popper>
      </button>
    );
  }
}

export default HierarchicalCheckboxMenu;
