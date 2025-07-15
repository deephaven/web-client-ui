import React, {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Button } from '../Button';
import SearchInput from '../SearchInput';
import type { NavTabItem } from './NavTabList';
import './DashboardList.scss';
import { GLOBAL_SHORTCUTS } from '../shortcuts';

export interface DashboardListProps {
  onSelect: (tab: NavTabItem) => void;
  tabs?: NavTabItem[];
}

/**
 * Display a search field and a list of dashboard tabs
 * @param props The tabs and handlers to use for this list
 * @returns A JSX element for the list of dashboard tabs, along with search
 */
export function DashboardList(props: DashboardListProps): JSX.Element {
  const { onSelect, tabs = [] } = props;
  const [searchText, setSearchText] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const searchField = useRef<SearchInput>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (searchField.current) {
      searchField.current.focus();
    }
  }, []);

  useEffect(() => {
    setFocusedIndex(0);
  }, [searchText]);

  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [focusedIndex]);

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
        setFocusedIndex(prev =>
          prev === -1 ? 0 : (prev + 1) % filteredTabs.length
        );
      } else if (event.key === 'ArrowUp' && filteredTabs.length > 0) {
        event.preventDefault();
        setFocusedIndex(prev => {
          if (prev === -1) return filteredTabs.length - 1;
          return (prev - 1 + filteredTabs.length) % filteredTabs.length;
        });
      } else if (event.key === 'Enter' && filteredTabs.length > 0) {
        event.preventDefault();
        const selectedIndex = focusedIndex >= 0 ? focusedIndex : 0;
        handleTabSelect(filteredTabs[selectedIndex]);
      } else if (event.key === 'Tab') {
        event.preventDefault();
      }
    },
    [filteredTabs, focusedIndex, handleTabSelect]
  );

  const tabElements = useMemo(
    () =>
      filteredTabs.map((tab, index) => (
        <li
          key={tab.key}
          ref={(el: HTMLLIElement | null) => {
            itemRefs.current[index] = el;
          }}
        >
          <Button
            kind="ghost"
            data-testid={`dashboard-list-item-${tab.key ?? ''}-button`}
            onClick={() => handleTabSelect(tab)}
            className={focusedIndex === index ? 'focused' : ''}
          >
            {tab.icon ? (
              <span className="dashboard-list-item-icon">
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
    [filteredTabs, handleTabSelect, focusedIndex]
  );

  const errorElement = useMemo(
    () =>
      tabElements.length === 0 ? <span>No open dashboard found.</span> : null,
    [tabElements]
  );

  return (
    <div className="dashboard-list-container d-flex flex-column">
      <div className="dashboard-list-header">
        <SearchInput
          value={searchText}
          placeholder="Find open dashboard"
          endPlaceholder={GLOBAL_SHORTCUTS.OPEN_DASHBOARD_SEARCH_MENU.getDisplayText()}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          ref={searchField}
        />
      </div>
      <ul className="dashboard-list flex-grow-1" ref={listRef}>
        {errorElement && (
          <li className="dashboard-list-message">{errorElement}</li>
        )}
        {!errorElement && tabElements}
      </ul>
    </div>
  );
}

export default DashboardList;
