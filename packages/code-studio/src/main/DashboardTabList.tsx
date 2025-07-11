import React, {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button, SearchInput } from '@deephaven/components';
import type { NavTabItem } from '@deephaven/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import './DashboardTabList.scss';

export interface DashboardTabListProps {
  onSelect: (tab: NavTabItem) => void;
  tabs?: NavTabItem[];
}

/**
 * Display a search field and a list of dashboard tabs
 * @param props The tabs and handlers to use for this list
 * @returns A JSX element for the list of dashboard tabs, along with search
 */
export function DashboardTabList(props: DashboardTabListProps): JSX.Element {
  const { onSelect, tabs = [] } = props;
  const [searchText, setSearchText] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchField = useRef<SearchInput>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Focus the search input when the component mounts
  useEffect(() => {
    if (searchField.current) {
      searchField.current.focus();
    }
  }, []);

  // Reset focused index when the search text changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchText]);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  }, []);

  const handleTabSelect = useCallback(
    (tab: NavTabItem) => {
      onSelect(tab);
    },
    [onSelect]
  );

  const filteredTabs = useMemo(
    () =>
      tabs.filter(tab =>
        tab.title.toLowerCase().includes(searchText.toLowerCase())
      ),
    [searchText, tabs]
  ).sort((a, b) => a.title.localeCompare(b.title) ?? 0);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowDown' && filteredTabs.length > 0) {
        event.preventDefault();
        setFocusedIndex(0);
        buttonRefs.current[0]?.focus();
      }
    },
    [filteredTabs.length]
  );

  const handleListKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusedIndex(prev => {
          const newIndex = (prev + 1) % filteredTabs.length;
          buttonRefs.current[newIndex]?.focus();
          return newIndex;
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusedIndex(prev => {
          const newIndex =
            (prev - 1 + filteredTabs.length) % filteredTabs.length;
          buttonRefs.current[newIndex]?.focus();
          return newIndex;
        });
      } else if (event.key === 'Enter' && focusedIndex >= 0) {
        event.preventDefault();
        handleTabSelect(filteredTabs[focusedIndex]);
      }
    },
    [filteredTabs, focusedIndex, handleTabSelect]
  );

  const tabElements = useMemo(
    () =>
      filteredTabs.map((tab, index) => (
        <li key={tab.key}>
          <Button
            kind="ghost"
            data-testid={`dashboard-tab-list-item-${tab.key ?? ''}-button`}
            onClick={() => handleTabSelect(tab)}
            onKeyDown={handleListKeyDown}
            className={focusedIndex === index ? 'focused' : ''}
            ref={(el: HTMLButtonElement | null) => {
              buttonRefs.current[index] = el;
            }}
          >
            {tab.icon ? (
              <span className="dashboard-tab-list-item-icon">
                {React.isValidElement(tab.icon) ? (
                  tab.icon
                ) : (
                  <FontAwesomeIcon icon={tab.icon as IconDefinition} />
                )}
              </span>
            ) : null}
            {tab.title}
          </Button>
        </li>
      )),
    [filteredTabs, handleTabSelect, focusedIndex, handleListKeyDown]
  );

  const errorElement = useMemo(
    () => (tabElements.length === 0 ? <span>No dashboards found.</span> : null),
    [tabElements]
  );

  return (
    <div className="dashboard-tab-list-container d-flex flex-column">
      <div className="dashboard-tab-list-header">
        <SearchInput
          value={searchText}
          placeholder="Find dashboard"
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          ref={searchField}
        />
      </div>
      <ul className="dashboard-tab-list flex-grow-1">
        {errorElement && (
          <li className="dashboard-tab-list-message">{errorElement}</li>
        )}
        {!errorElement && tabElements}
      </ul>
    </div>
  );
}

export default DashboardTabList;
