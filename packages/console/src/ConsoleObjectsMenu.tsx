import React, { ReactElement, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  DropdownActions,
  DropdownMenu,
  SearchInput,
} from '@deephaven/components';
import { vsGraph, vsTriangleDown } from '@deephaven/icons';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { ObjectIcon } from './common';

interface ConsoleObjectsMenuProps {
  openObject: (object: DhType.ide.VariableDefinition) => void;
  objects: readonly DhType.ide.VariableDefinition[];
}

function ConsoleObjectsMenu({
  openObject,
  objects,
}: ConsoleObjectsMenuProps): ReactElement {
  const [filterText, setFilterText] = useState('');
  const searchRef = useRef<SearchInput>(null);

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
          ({ title }: { title?: string }) =>
            title != null &&
            title.toLowerCase().indexOf(filterText.toLowerCase()) >= 0
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
      onClick={() => {
        // no-op: click is handled in `DropdownMenu`
      }}
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
        onMenuOpened={() => searchRef.current?.focus()}
        onMenuClosed={() => setFilterText('')}
        options={{ initialKeyboardIndex: 1 }}
        popperOptions={{ placement: 'bottom-end' }}
      />
    </Button>
  );
}

export default ConsoleObjectsMenu;
