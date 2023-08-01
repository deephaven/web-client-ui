/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
// background click is just a convenience method, not an actual a11y issue

import React, {
  ChangeEvent,
  Component,
  ReactNode,
  KeyboardEvent,
  MouseEvent,
} from 'react';
import memoizeOne from 'memoize-one';
import shortid from 'shortid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  vsEdit,
  vsGear,
  vsSave,
  vsCircleSlash,
  vsTrash,
  vsDeviceCamera,
  dhRefresh,
  dhNewCircleLargeFilled,
  vsCircleLargeFilled,
  vsArrowSmallUp,
} from '@deephaven/icons';
import Log from '@deephaven/log';
import { Button, CardFlip, RadioGroup, RadioItem } from '@deephaven/components';

import './FilterSetManager.scss';

const log = Log.module('FilterSetManager');

export interface FilterSetPanel {
  panelId?: string | string[] | null;
  type: string;
  id?: string;
  state: unknown;
}

export interface FilterSet {
  id: string;
  title: string;
  panels: FilterSetPanel[];
  restoreFullState?: boolean;
}

export interface ChangeHandlerArgs {
  isValueShown: boolean;
  selectedId?: string;
}

interface FilterSetManagerProps {
  isValueShown: boolean;
  selectedId?: string;
  filterSets: FilterSet[];
  getFilterState(): FilterSetPanel[];
  onChange(args: ChangeHandlerArgs): void;
  onApply(filterSet: FilterSet): void;
  onUpdateSets(filterSets: FilterSet[], editId?: string): void;
}

interface FilterSetManagerState {
  nameInputValue: string;
  nameInputError?: string;
  editId?: string;
  renameSet?: FilterSet;
  // Unsaved set changes on the settings screen
  modifiedFilterSets: FilterSet[];
  restoreFullState: boolean;
}

const NAME_INPUT_PLACEHOLDER = 'Enter name...';

const EMPTY_LIST_PLACEHOLDER = 'No Available Filter Sets';

class FilterSetManager extends Component<
  FilterSetManagerProps,
  FilterSetManagerState
> {
  static animateScreenFlash(): void {
    const overlay = document.createElement('div');
    overlay.classList.add('screen-flash-overlay');
    overlay.addEventListener('animationend', () => {
      // Removing the element removes its event listeners
      overlay.remove();
    });
    document.querySelector('body')?.appendChild(overlay);
  }

  constructor(props: FilterSetManagerProps) {
    super(props);

    this.handleSettingsCancel = this.handleSettingsCancel.bind(this);
    this.handleSettingsClick = this.handleSettingsClick.bind(this);
    this.handleSettingsSave = this.handleSettingsSave.bind(this);
    this.handleBackgroundClick = this.handleBackgroundClick.bind(this);
    this.handleEditDropdownChange = this.handleEditDropdownChange.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleFilterApply = this.handleFilterApply.bind(this);
    this.handleCaptureNewSet = this.handleCaptureNewSet.bind(this);
    this.handleNameInputChange = this.handleNameInputChange.bind(this);
    this.handleNameInputKeyPress = this.handleNameInputKeyPress.bind(this);
    this.handleRenameConfirm = this.handleRenameConfirm.bind(this);
    this.handleRenameCancel = this.handleRenameCancel.bind(this);
    this.handleRestoreFullStateChange =
      this.handleRestoreFullStateChange.bind(this);

    this.handleSetDelete = this.handleSetDelete.bind(this);
    this.handleSetEdit = this.handleSetEdit.bind(this);
    this.handleSetUpdate = this.handleSetUpdate.bind(this);

    this.state = {
      editId: undefined,
      renameSet: undefined,
      nameInputValue: '',
      nameInputError: undefined,
      modifiedFilterSets: [],
      restoreFullState: false,
    };
  }

  componentDidMount(): void {
    const { isValueShown } = this.props;
    if (isValueShown) {
      this.updateSelectedId();
    } else {
      this.initSettingsScreen();
    }
  }

  componentDidUpdate(
    prevProps: FilterSetManagerProps,
    prevState: FilterSetManagerState
  ): void {
    const { isValueShown, filterSets } = this.props;
    const { modifiedFilterSets } = this.state;

    if (prevProps.isValueShown && !isValueShown) {
      this.initSettingsScreen();
    }

    if (this.isNameInputScreen() && !this.isNameInputScreen(prevState)) {
      this.focusRenameInput();
    }

    if (filterSets !== prevProps.filterSets) {
      if (
        !isValueShown &&
        filterSets.length > 0 &&
        prevProps.filterSets.length === 0 &&
        modifiedFilterSets.length === 0
      ) {
        // Filter set added from another panel, flip from the settings side/initial screen to the value side
        const { onChange } = this.props;
        onChange({ isValueShown: true, selectedId: filterSets[0].id });
      } else {
        this.updateSelectedId();
      }
    }
  }

  private renameInputRef = React.createRef<HTMLInputElement>();

  private dropdownRef = React.createRef<HTMLSelectElement>();

  private editDropdownRef = React.createRef<HTMLSelectElement>();

  initSettingsScreen(): void {
    const { filterSets, selectedId } = this.props;
    log.debug('initSettingsScreen', filterSets, selectedId);
    this.setState({
      modifiedFilterSets: [...filterSets],
      editId: selectedId,
    });
  }

  // Update selected id without applying the new set on filterSets change
  updateSelectedId(): void {
    const { isValueShown, filterSets, selectedId, onChange } = this.props;
    log.debug('updateSelectedId', filterSets, selectedId);
    if (!isValueShown) {
      return;
    }
    if (!filterSets.some(({ id }) => id === selectedId)) {
      // Update the selection if selectedId doesn't exist in the list
      // Flip to the settings side for empty list to show the initial screen
      const isEmptyList = filterSets.length === 0;
      onChange({
        isValueShown: !isEmptyList,
        selectedId: isEmptyList ? undefined : filterSets[0].id,
      });
    }
  }

  handleEditDropdownChange(event: ChangeEvent<HTMLSelectElement>): void {
    const { value: editId } = event.target;
    this.setState({ editId });
  }

  handleFilterChange(event: ChangeEvent<HTMLSelectElement>): void {
    const { value: selectedId } = event.target;
    const { isValueShown, onChange } = this.props;
    this.applyFilterSet(selectedId);
    onChange({ isValueShown, selectedId });
  }

  handleFilterApply(): void {
    const { selectedId } = this.props;
    this.applyFilterSet(selectedId);
  }

  handleSettingsCancel(): void {
    const { onChange, selectedId, filterSets } = this.props;
    this.setState({ modifiedFilterSets: [] });
    // Flip the card to the filter set selection screen if the sets list isn't empty
    // Otherwise show the initial screen
    if (filterSets.length > 0) {
      onChange({ isValueShown: true, selectedId });
    }
  }

  handleSettingsSave(): void {
    const { onChange, onUpdateSets } = this.props;
    const { modifiedFilterSets, editId } = this.state;
    this.setState({ modifiedFilterSets: [] });
    log.debug('Update sets', modifiedFilterSets, editId);
    onUpdateSets(modifiedFilterSets);
    // Don't flip the card to the filter set selection screen if the updated sets list is empty
    if (modifiedFilterSets.length > 0) {
      onChange({ isValueShown: true, selectedId: editId });
    }
  }

  handleCaptureNewSet(): void {
    const { getFilterState } = this.props;
    FilterSetManager.animateScreenFlash();
    const id = shortid();
    const panels = getFilterState();
    const renameSet = {
      id,
      title: '',
      panels,
    };
    log.debug('handleSetCreate', renameSet);
    this.setState({ nameInputValue: '', nameInputError: undefined, renameSet });
  }

  handleRenameCancel(): void {
    this.setState({ renameSet: undefined });
  }

  handleRestoreFullStateChange(event: ChangeEvent<HTMLInputElement>): void {
    this.setState({
      restoreFullState: event.target.value === 'true',
    });
  }

  getNameError(nameInputValue: string): string | undefined {
    const { renameSet, modifiedFilterSets } = this.state;
    const trimmedName = nameInputValue?.trim() ?? '';
    if (trimmedName.length === 0) {
      log.debug('Name cannot be empty', trimmedName);
      return 'Name cannot be empty';
    }

    if (
      renameSet !== undefined &&
      modifiedFilterSets.some(
        ({ title, id }) => title === trimmedName && id !== renameSet.id
      )
    ) {
      log.debug('Set with this name already exists', trimmedName);
      return 'Set with this name already exists';
    }

    return undefined;
  }

  handleRenameConfirm(): void {
    const { nameInputValue, renameSet, modifiedFilterSets, restoreFullState } =
      this.state;
    if (renameSet === undefined) {
      log.error('Renamed set undefined.');
      return;
    }
    const nameInputError = this.getNameError(nameInputValue);
    log.debug('handleRenameConfirm', nameInputValue, nameInputError);
    if (nameInputError !== undefined) {
      this.setState({ nameInputError });
      return;
    }
    const trimmedName = nameInputValue?.trim() ?? '';
    const namedFilterSet = {
      ...renameSet,
      title: trimmedName,
      restoreFullState,
    };
    const selectedIndex = modifiedFilterSets.findIndex(
      ({ id }) => id === renameSet.id
    );
    const updatedModifiedFilterSets = [...modifiedFilterSets];

    if (selectedIndex >= 0) {
      updatedModifiedFilterSets[selectedIndex] = namedFilterSet;
      log.debug('Renamed existing set', updatedModifiedFilterSets);
    } else {
      updatedModifiedFilterSets.push(namedFilterSet);
      log.debug('Added new set to modified sets', updatedModifiedFilterSets);
    }

    this.setState({
      editId: namedFilterSet.id,
      modifiedFilterSets: updatedModifiedFilterSets,
      renameSet: undefined,
    });
  }

  handleSetDelete(): void {
    this.setState(state => {
      const { editId, modifiedFilterSets: prevFilterSets } = state;
      const selectedIndex = prevFilterSets.findIndex(({ id }) => id === editId);
      if (selectedIndex < 0) {
        log.error(
          'Unable to find selected filterSet index',
          prevFilterSets,
          editId
        );
        return null;
      }
      const modifiedFilterSets = prevFilterSets.filter(
        ({ id }) => id !== editId
      );
      const newSelectedIndex = Math.max(
        0,
        Math.min(modifiedFilterSets.length - 1, selectedIndex - 1)
      );
      const newSelectedId =
        modifiedFilterSets.length > 0
          ? modifiedFilterSets[newSelectedIndex].id
          : undefined;
      log.debug(
        'Deleted selected set',
        editId,
        prevFilterSets,
        modifiedFilterSets
      );
      log.debug('New selection', newSelectedIndex, newSelectedId);
      return {
        modifiedFilterSets,
        editId: newSelectedId,
      };
    });
  }

  handleSetUpdate(): void {
    const { getFilterState } = this.props;
    FilterSetManager.animateScreenFlash();
    const panels = getFilterState();
    this.setState(({ modifiedFilterSets: prevFilterSets, editId }) => {
      if (editId === undefined) {
        log.error('Filter for update not selected.');
        return null;
      }
      const modifiedFilterSets = [...prevFilterSets];
      const selectedSetIndex = modifiedFilterSets.findIndex(
        ({ id }) => id === editId
      );
      if (selectedSetIndex < 0) {
        log.error('Selected set for update not found.');
        return null;
      }
      // Clone selected set to avoid mutation of the props
      modifiedFilterSets[selectedSetIndex] = {
        ...modifiedFilterSets[selectedSetIndex],
        panels,
      };

      log.debug('Update set', modifiedFilterSets, panels);
      return {
        modifiedFilterSets,
      };
    });
  }

  handleSetEdit(): void {
    this.setState(({ editId, modifiedFilterSets }) => {
      const selectedSet = modifiedFilterSets.find(({ id }) => id === editId);
      if (selectedSet === undefined) {
        log.error('Could not find selected set', editId, modifiedFilterSets);
        return null;
      }
      const { title, restoreFullState = false } = selectedSet;
      return {
        nameInputValue: title,
        nameInputError: undefined,
        renameSet: selectedSet,
        restoreFullState,
      };
    });
  }

  handleSettingsClick(event: MouseEvent): void {
    event.stopPropagation();
    const { onChange, selectedId } = this.props;
    onChange({ isValueShown: false, selectedId });
  }

  handleBackgroundClick(event: MouseEvent): void {
    log.debug('handleBackgroundClick');
    // allow clicking anywhere in the background to select and focus the input
    if (event.target !== this.dropdownRef.current) {
      this.focusInput();
    }
  }

  handleNameInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const { value: nameInputValue } = event.target;
    const nameInputError = this.getNameError(nameInputValue);
    this.setState({ nameInputValue, nameInputError });
  }

  handleNameInputKeyPress(event: KeyboardEvent): void {
    const { key } = event;
    if (key === 'Enter') {
      event.preventDefault();
      this.handleRenameConfirm();
    }
  }

  isNameInputScreen(state = this.state): boolean {
    const { renameSet } = state;
    return renameSet !== undefined;
  }

  isRenamingExistingSet = memoizeOne(
    (filterSets: FilterSet[], renameSet?: FilterSet): boolean =>
      renameSet !== undefined &&
      filterSets.some(({ id }) => id === renameSet.id)
  );

  applyFilterSet(selectedId?: string): void {
    const { onApply, filterSets } = this.props;
    if (selectedId === undefined) {
      log.debug('No filter selected');
      return;
    }
    const filterSet = filterSets.find(({ id }) => id === selectedId);
    if (filterSet === undefined) {
      log.debug('Selected id not found in filterSets', selectedId, filterSets);
      return;
    }
    log.debug('Apply filterSet', filterSet);
    onApply(filterSet);
  }

  focusInput(): void {
    this.dropdownRef.current?.focus();
  }

  focusRenameInput(): void {
    this.renameInputRef.current?.focus();
  }

  render(): ReactNode {
    const {
      nameInputValue,
      nameInputError,
      editId,
      renameSet,
      modifiedFilterSets,
      restoreFullState,
    } = this.state;
    const { isValueShown, filterSets, selectedId } = this.props;
    const isNameInputScreen = this.isNameInputScreen();
    const isRenamingExistingSet = this.isRenamingExistingSet(
      modifiedFilterSets,
      renameSet
    );
    const isEmptyEditList = modifiedFilterSets.length === 0;
    const isInitialScreen =
      !isNameInputScreen && isEmptyEditList && filterSets.length === 0;
    const isEditListScreen = !isNameInputScreen && !isInitialScreen;
    const captureSetIcon = (
      <div className="fa-layers mr-3">
        <FontAwesomeIcon
          icon={vsCircleLargeFilled}
          mask={vsDeviceCamera}
          transform="shrink-1 down-5 right-7"
        />
        <FontAwesomeIcon
          icon={dhNewCircleLargeFilled}
          className="text-primary"
          transform="shrink-6 down-5 right-7"
        />
      </div>
    );
    const updateSetIcon = (
      <div className="fa-layers">
        <FontAwesomeIcon
          icon={vsCircleLargeFilled}
          mask={vsDeviceCamera}
          transform="shrink-1 down-5 right-7"
        />
        <FontAwesomeIcon
          icon={vsArrowSmallUp}
          transform="shrink-1 down-5 right-7"
        />
      </div>
    );
    return (
      <div className="filter-set-manager fill-parent-absolute">
        <CardFlip className="w-100 h-100" isFlipped={isValueShown}>
          <div
            className="filter-set-manager-settings-card fill-parent-absolute"
            key="front"
          >
            <div className="filter-set-manager-card-content">
              {isInitialScreen && (
                <div>
                  <Button
                    kind="ghost"
                    className="btn btn-link no-underline"
                    onClick={this.handleCaptureNewSet}
                    icon={captureSetIcon}
                  >
                    Capture filter set
                  </Button>
                  <div className="py-3  text-muted small">
                    Takes a snapshot of the currently applied filters on all
                    panels, allowing you to restore saved filter sets later.
                  </div>
                </div>
              )}

              {isNameInputScreen && (
                <div
                  className="d-flex flex-column justify-content-center"
                  data-testid="edit-filter-set-container"
                >
                  <div className="form-group">
                    <label>
                      {isRenamingExistingSet ? 'Edit set' : 'Name captured set'}
                    </label>
                    <div className="name-input-container">
                      <input
                        type="text"
                        className="input-set-name form-control"
                        placeholder={NAME_INPUT_PLACEHOLDER}
                        value={nameInputValue}
                        ref={this.renameInputRef}
                        onChange={this.handleNameInputChange}
                        onKeyPress={this.handleNameInputKeyPress}
                        spellCheck="false"
                      />
                      <Button
                        data-testid="rename-confirm-button"
                        kind="ghost"
                        className="btn btn-link no-underline pt-2 pb-2"
                        onClick={this.handleRenameConfirm}
                        tooltip="Save"
                        test-id="button-save"
                        icon={vsSave}
                      />

                      <Button
                        data-testid="rename-cancel-button"
                        kind="ghost"
                        className="btn btn-link no-underline pt-2 pb-2"
                        onClick={this.handleRenameCancel}
                        tooltip="Cancel"
                        icon={vsCircleSlash}
                      />
                    </div>
                    {nameInputError !== undefined && (
                      <div className="error-message">{nameInputError}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <RadioGroup
                      onChange={this.handleRestoreFullStateChange}
                      value={`${restoreFullState}`}
                    >
                      <RadioItem value="false">Restore only filters</RadioItem>
                      <RadioItem value="true">
                        Restore full table state
                      </RadioItem>
                    </RadioGroup>
                  </div>
                </div>
              )}

              {isEditListScreen && (
                <div className="filter-set-manager-settings-grid-1">
                  <div className="form-group">
                    <label>Edit filter sets</label>
                    <div className="filter-select-container">
                      <select
                        data-testid="settings-card-filter-select"
                        ref={this.editDropdownRef}
                        value={editId ?? '-1'}
                        className="custom-select filter-value-select"
                        onChange={this.handleEditDropdownChange}
                        disabled={isEmptyEditList}
                      >
                        {isEmptyEditList && (
                          <option value="-1" disabled>
                            {EMPTY_LIST_PLACEHOLDER}
                          </option>
                        )}
                        {modifiedFilterSets.map(({ id, title }) => (
                          <option key={id} value={id}>
                            {title}
                          </option>
                        ))}
                      </select>

                      <Button
                        kind="ghost"
                        onClick={this.handleSetUpdate}
                        disabled={isEmptyEditList}
                        icon={updateSetIcon}
                        tooltip="Update"
                      />

                      <Button
                        kind="ghost"
                        onClick={this.handleSetEdit}
                        disabled={isEmptyEditList}
                        icon={vsEdit}
                        tooltip="Edit"
                      />

                      <Button
                        kind="ghost"
                        onClick={this.handleSetDelete}
                        disabled={isEmptyEditList}
                        icon={vsTrash}
                        tooltip="Delete"
                      />
                    </div>
                  </div>

                  <div>
                    <Button
                      kind="ghost"
                      className="btn btn-link no-underline"
                      onClick={this.handleCaptureNewSet}
                      icon={captureSetIcon}
                    >
                      Capture new filter set
                    </Button>
                  </div>

                  <div className="py-3 text-right">
                    <Button
                      kind="secondary"
                      onClick={this.handleSettingsCancel}
                    >
                      Cancel
                    </Button>
                    &nbsp;
                    <Button kind="primary" onClick={this.handleSettingsSave}>
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div
            className="filter-set-manager-value-card fill-parent-absolute"
            key="back"
            onClick={this.handleBackgroundClick}
          >
            <div className="filter-set-manager-column">
              <div className="filter-set-manager-column-title">Filter sets</div>
            </div>
            <div className="filter-set-manager-card-content">
              <div className="filter-set-manager-value-input">
                <div className="filter-select-container">
                  <select
                    data-testid="value-card-filter-select"
                    ref={this.dropdownRef}
                    value={selectedId}
                    className="custom-select filter-value-select"
                    onChange={this.handleFilterChange}
                  >
                    {filterSets.length === 0 && (
                      <option value="-1" disabled>
                        {EMPTY_LIST_PLACEHOLDER}
                      </option>
                    )}
                    {filterSets.map(({ id, title }) => (
                      <option key={id} value={id}>
                        {title}
                      </option>
                    ))}
                  </select>
                  <Button
                    data-testid="filter-apply-button"
                    kind="ghost"
                    onClick={this.handleFilterApply}
                    icon={dhRefresh}
                    tooltip="Apply Filter Set"
                  />
                </div>
              </div>
            </div>
            <div className="filter-set-manager-menu">
              <Button
                kind="ghost"
                className="btn btn-link btn-link-icon m-2 px-2"
                onClick={this.handleSettingsClick}
                tooltip="Settings"
                icon={<FontAwesomeIcon icon={vsGear} transform="grow-4" />}
              />
            </div>
          </div>
        </CardFlip>
      </div>
    );
  }
}

export default FilterSetManager;
