import React, {
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  DropdownActions,
  DropdownMenu,
  SearchInput,
} from '@deephaven/components';
import { vsGraph, vsTriangleDown } from '@deephaven/icons';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { useDebouncedCallback } from '@deephaven/react-hooks';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import { ObjectIcon } from './common';

interface ConsoleObjectsMenuProps {
  openObject: (object: DhType.ide.VariableDefinition) => void;
  objects: readonly DhType.ide.VariableDefinition[];
}

const RESET_FILTER_DELAY = 5000;

function ConsoleObjectsMenu({
  openObject,
  objects,
}: ConsoleObjectsMenuProps): ReactElement {
  const [filterText, setFilterText] = useState('');
  const searchRef = useRef<SearchInput>(null);

  const resetFilter = useDebouncedCallback(() => {
    setFilterText('');
  }, RESET_FILTER_DELAY);

  const handleMenuOpen = useCallback(() => {
    resetFilter.cancel();
    searchRef.current?.select();
  }, [resetFilter]);

  const handleMenuClose = useCallback(() => {
    resetFilter();
  }, [resetFilter]);

  const actions: DropdownActions = useMemo(() => {
    if (objects.length === 0) {
      return [];
    }
    const searchActions = {
      menuElement: (
        <SearchInput
          value={filterText}
          onChange={e => {
            setFilterText(e.target.value);
          }}
          className="console-menu"
          ref={searchRef}
        />
      ),
    };
    const filteredObjects = filterText
      ? objects.filter(
          ({ title }) =>
            title != null &&
            title.toLowerCase().includes(filterText.toLowerCase())
        )
      : objects;
    const objectActions = filteredObjects.map(object => ({
      title: object.title,
      action: () => {
        openObject(object);
      },
      icon: <ObjectIcon type={object.type} />,
    }));
    return [searchActions, ...objectActions];
  }, [objects, filterText, openObject]);

  return (
    <Button
      aria-label="Objects"
      kind="ghost"
      disabled={objects.length === 0}
      // no-op: click is handled in `DropdownMenu`
      onClick={EMPTY_FUNCTION}
      tooltip={objects.length === 0 ? 'No objects available' : 'Objects'}
      icon={
        <div className="fa-md fa-layers">
          <FontAwesomeIcon
            mask={vsGraph}
            icon={vsTriangleDown}
            transform="right-5 down-5"
          />
          <FontAwesomeIcon icon={vsTriangleDown} transform="right-8 down-6" />
        </div>
      }
    >
      <DropdownMenu
        actions={actions}
        onMenuOpened={handleMenuOpen}
        onMenuClosed={handleMenuClose}
        options={{ initialKeyboardIndex: 1 }}
        popperOptions={{ placement: 'bottom-end' }}
      />
    </Button>
  );
}

export default ConsoleObjectsMenu;
