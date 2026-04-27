import React, { useCallback, useId, useMemo, useRef } from 'react';
import type { DOMRefValue } from '@react-types/shared';
import type { Placement } from '@react-types/overlays';
import { Field } from '@react-spectrum/label';
import { FocusRing } from '@react-aria/focus';
import { Popover } from '@react-spectrum/overlays';
import { useUnwrapDOMRef } from '@react-spectrum/utils';
import { useOverlayTriggerState } from '@react-stately/overlays';
import ChevronDownMedium from '@spectrum-icons/ui/ChevronDownMedium';
import AlertMedium from '@spectrum-icons/ui/AlertMedium';
import { ProgressCircle } from '@adobe/react-spectrum';
import cl from 'classnames';
import { EMPTY_FUNCTION, ensureArray } from '@deephaven/utils';
import { useMergeRef } from '@deephaven/react-hooks';
import { normalizeTooltipOptions, wrapItemChildren } from '../utils';
import type { MenuTriggerAction } from '../comboBox';
import { type MultiSelectProps } from './MultiSelectProps';
import {
  flattenJsxChildren,
  flattenEntriesToItems,
  type MultiSelectFlatEntry,
} from './multiSelectUtils';
import { useMultiSelectState } from './useMultiSelectState';
import { useMultiSelectFilter } from './useMultiSelectFilter';
import { useMultiSelectKeyboard } from './useMultiSelectKeyboard';
import { useMultiSelectLoadingSpinner } from './useMultiSelectLoadingSpinner';
import { useMultiSelectScrollListener } from './useMultiSelectScrollListener';
import { MultiSelectTag } from './MultiSelectTag';
import { MultiSelectListBox } from './MultiSelectListBox';
import './MultiSelect.scss';

/**
 * Multi-select styled to match Spectrum ComboBox. Renders selected items as
 * tags inside the trigger area alongside a filter input. Accepts the same
 * `Item` / `Section` JSX children as `Picker`.
 */
function MultiSelectInner(
  props: MultiSelectProps,
  forwardedRef: React.Ref<HTMLDivElement>
): JSX.Element {
  const {
    children,
    tooltip = true,
    selectedKeys: propSelectedKeys,
    defaultSelectedKeys,
    disabledKeys: propDisabledKeys,
    onChange: propOnChange,
    onSelectionChange: propOnSelectionChange,
    onOpenChange,
    onScroll = EMPTY_FUNCTION,
    label,
    description,
    errorMessage,
    isRequired = false,
    isDisabled = false,
    isReadOnly = false,
    validationState,
    isQuiet = false,
    labelPosition = 'top',
    labelAlign,
    necessityIndicator,
    contextualHelp,
    inputValue: controlledInputValue,
    defaultInputValue = '',
    onInputChange,
    shouldFocusWrap = false,
    loadingState,
    menuTrigger = 'input',
    align = 'start',
    direction = 'bottom',
    shouldFlip = true,
    menuWidth,
    allowsCustomValue = false,
    formValue = 'key',
    validationBehavior = 'aria',
    autoFocus = false,
    name,
    id,
    isHidden = false,
    onFocus,
    onBlur,
    onFocusChange,
    onKeyDown,
    onKeyUp,
    onSearchTextChange,
    selectedItemLabels,
    UNSAFE_className,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    'aria-details': ariaDetails,
    ...styleProps
  } = props;

  // Spectrum's onOpenChange omits the trigger reason; relay it via ref.
  const lastTriggerReasonRef = useRef<MenuTriggerAction | undefined>(undefined);

  const handleOverlayOpenChange = useCallback(
    (isOpen: boolean) => {
      onOpenChange?.(isOpen, lastTriggerReasonRef.current);
    },
    [onOpenChange]
  );

  const overlayState = useOverlayTriggerState({
    onOpenChange: handleOverlayOpenChange,
  });

  const openOverlay = useCallback(
    (reason: MenuTriggerAction) => {
      lastTriggerReasonRef.current = reason;
      overlayState.open();
    },
    [overlayState]
  );
  const closeOverlay = useCallback(() => {
    lastTriggerReasonRef.current = undefined;
    overlayState.close();
  }, [overlayState]);

  const listBoxId = useId();

  const placement = `${direction} ${align}` as Placement;

  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<DOMRefValue<HTMLDivElement>>(null);
  const unwrappedPopoverRef = useUnwrapDOMRef(popoverRef);
  const listBoxRef = useRef<DOMRefValue<HTMLDivElement>>(null);
  const unwrappedListBoxRef = useUnwrapDOMRef(listBoxRef);
  const isFocusedRef = useRef(false);
  const mergedTriggerRef = useMergeRef(triggerRef, forwardedRef);

  // Ensures Item/ItemContent wrapping for tooltips/overflow.
  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );
  const wrappedChildren = useMemo(
    () => ensureArray(wrapItemChildren(children, tooltipOptions)),
    [children, tooltipOptions]
  );

  // Flat {key,label} entries for filter/keyboard hooks. ListBox renders JSX directly.
  const allEntries: MultiSelectFlatEntry[] = useMemo(
    () => flattenJsxChildren(wrappedChildren),
    [wrappedChildren]
  );

  const allItems = useMemo(
    () => flattenEntriesToItems(allEntries),
    [allEntries]
  );
  const allKeys = useMemo(() => allItems.map(i => i.key), [allItems]);
  const itemLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    allItems.forEach(i => m.set(i.key, i.label));
    return m;
  }, [allItems]);

  const getLabelFor = useCallback(
    (key: string): string =>
      itemLabelMap.get(key) ?? selectedItemLabels?.get(key) ?? key,
    [itemLabelMap, selectedItemLabels]
  );

  const { searchText, setSearchText, filteredItems, filteredJsxChildren } =
    useMultiSelectFilter({
      allEntries,
      wrappedChildren,
      inputValue: controlledInputValue,
      defaultInputValue,
      onInputChange,
      onSearchTextChange,
    });

  const emptyMessage: string | undefined = useMemo(() => {
    if (filteredItems.length > 0) {
      return undefined;
    }
    if (loadingState === 'loading') {
      return 'Loading...';
    }
    // loadingMore + empty: defer to ListBox's loader pill instead of "No results".
    if (loadingState === 'loadingMore') {
      return undefined;
    }
    return 'No results';
  }, [filteredItems.length, loadingState]);

  const {
    selectedKeys,
    selectedKeyArray,
    listBoxDisabledKeys,
    toggleKey,
    applyListBoxSelection,
  } = useMultiSelectState({
    selectedKeys: propSelectedKeys,
    defaultSelectedKeys,
    disabledKeys: propDisabledKeys,
    onChange: propOnChange,
    onSelectionChange: propOnSelectionChange,
    allKeys,
  });

  const { handleInputKeyDown } = useMultiSelectKeyboard({
    filteredItems,
    allItems,
    shouldFocusWrap,
    overlayState,
    openOverlay,
    closeOverlay,
    isReadOnly,
    isDisabled,
    searchText,
    setSearchText,
    selectedKeys,
    toggleKey,
    allowsCustomValue,
    menuTrigger,
    onKeyDown,
    listBoxContainerRef: unwrappedListBoxRef,
    inputRef,
  });

  useMultiSelectScrollListener({
    containerRef: unwrappedListBoxRef,
    isOpen: overlayState.isOpen,
    onScroll,
  });

  const shouldShowInlineSpinner = useMultiSelectLoadingSpinner({
    loadingState,
    searchText,
    isOpen: overlayState.isOpen,
    menuTrigger,
  });

  const refocusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const handleTagRemove = useCallback(
    (key: string) => {
      toggleKey(key);
      refocusInput();
    },
    [toggleKey, refocusInput]
  );

  const handleListBoxSelectionChange = useCallback(
    (selection: Parameters<typeof applyListBoxSelection>[0]) => {
      if (isReadOnly) {
        return;
      }
      applyListBoxSelection(selection, filteredItems);
      refocusInput();
    },
    [isReadOnly, applyListBoxSelection, filteredItems, refocusInput]
  );

  const handleInputFocus = useCallback(
    (e: React.FocusEvent) => {
      if (isFocusedRef.current) {
        return;
      }
      isFocusedRef.current = true;
      if (menuTrigger === 'focus' && !overlayState.isOpen && !isDisabled) {
        openOverlay('focus');
      }
      onFocus?.(e);
      onFocusChange?.(true);
    },
    [onFocus, onFocusChange, menuTrigger, overlayState, isDisabled, openOverlay]
  );

  const handleInputBlur = useCallback(
    (e: React.FocusEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      // Ignore null relatedTarget (DOM churn during re-render).
      // Real dismisses carry a relatedTarget or are handled by Spectrum.
      if (related == null) {
        return;
      }
      if (triggerRef.current != null && triggerRef.current.contains(related)) {
        return;
      }
      if (
        unwrappedPopoverRef.current != null &&
        unwrappedPopoverRef.current.contains(related)
      ) {
        return;
      }

      isFocusedRef.current = false;
      if (overlayState.isOpen) {
        closeOverlay();
      }
      onBlur?.(e);
      onFocusChange?.(false);
    },
    [onBlur, onFocusChange, overlayState, closeOverlay, unwrappedPopoverRef]
  );

  const handleTriggerAreaClick = useCallback(() => {
    if (isDisabled) {
      return;
    }
    if (!overlayState.isOpen) {
      openOverlay('manual');
    }
    inputRef.current?.focus();
  }, [isDisabled, overlayState, openOverlay]);

  const handleChevronClick = useCallback(
    (e: React.MouseEvent) => {
      // Stop trigger-area handler from re-opening the popover on close.
      e.stopPropagation();
      if (isDisabled) {
        return;
      }
      if (overlayState.isOpen) {
        closeOverlay();
      } else {
        openOverlay('manual');
      }
      inputRef.current?.focus();
    },
    [isDisabled, overlayState, openOverlay, closeOverlay]
  );

  return (
    <Field
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      label={label}
      description={description}
      errorMessage={validationState === 'invalid' ? errorMessage : undefined}
      isRequired={isRequired}
      isDisabled={isDisabled}
      validationState={validationState}
      labelPosition={labelPosition}
      labelAlign={labelAlign}
      necessityIndicator={necessityIndicator}
      contextualHelp={contextualHelp}
      wrapperClassName={cl('dh-multi-select', UNSAFE_className)}
    >
      <div style={isHidden ? { display: 'none' } : undefined}>
        <FocusRing within focusRingClass="focus-ring" focusClass="is-focused">
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            ref={mergedTriggerRef}
            id={id}
            onClick={handleTriggerAreaClick}
            className={cl('dh-multi-select-trigger', {
              'is-disabled': isDisabled,
              'is-read-only': isReadOnly,
              'is-quiet': isQuiet,
              'is-invalid': validationState === 'invalid',
            })}
          >
            <div className="dh-multi-select-content">
              {selectedKeyArray.map(key => (
                <MultiSelectTag
                  key={key}
                  tagKey={key}
                  label={getLabelFor(key)}
                  isDisabled={isDisabled}
                  isReadOnly={isReadOnly}
                  onRemove={handleTagRemove}
                />
              ))}
              <input
                ref={inputRef}
                className="dh-multi-select-input"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                onKeyUp={onKeyUp}
                disabled={isDisabled}
                readOnly={isReadOnly}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={autoFocus}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={overlayState.isOpen}
                aria-controls={overlayState.isOpen ? listBoxId : undefined}
                aria-autocomplete="list"
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                aria-describedby={ariaDescribedby}
                aria-details={ariaDetails}
              />
            </div>

            {shouldShowInlineSpinner && (
              <div className="dh-multi-select-loading-circle">
                <ProgressCircle aria-label="Loading" isIndeterminate size="S" />
              </div>
            )}

            {validationState === 'invalid' && !isDisabled && (
              <div className="dh-multi-select-invalid-icon" aria-hidden="true">
                <AlertMedium />
              </div>
            )}

            <div
              className={cl('dh-multi-select-chevron', {
                'is-open': overlayState.isOpen,
              })}
              onClick={handleChevronClick}
              // Suppress default to keep input focus on chevron click.
              onPointerDown={e => e.preventDefault()}
              role="button"
              tabIndex={-1}
              aria-label="Toggle dropdown"
            >
              <ChevronDownMedium />
            </div>
          </div>
        </FocusRing>

        {name != null && (
          <input
            type="hidden"
            name={name}
            value={
              formValue === 'text'
                ? selectedKeyArray.map(getLabelFor).join(',')
                : selectedKeyArray.join(',')
            }
            required={
              validationBehavior === 'native' && isRequired ? true : undefined
            }
          />
        )}

        {overlayState.isOpen && !isDisabled && (
          <Popover
            ref={popoverRef}
            triggerRef={triggerRef}
            state={overlayState}
            hideArrow
            isNonModal
            placement={placement}
            shouldFlip={shouldFlip}
            shouldCloseOnInteractOutside={target =>
              triggerRef.current?.contains(target) !== true
            }
            UNSAFE_style={{
              width: menuWidth ?? triggerRef.current?.offsetWidth ?? undefined,
            }}
          >
            <MultiSelectListBox
              listBoxRef={listBoxRef}
              listBoxId={listBoxId}
              loadingState={loadingState}
              filteredJsxChildren={filteredJsxChildren}
              selectedKeys={selectedKeys}
              disabledKeys={listBoxDisabledKeys}
              onSelectionChange={handleListBoxSelectionChange}
              ariaLabel={typeof label === 'string' ? label : 'Options'}
              emptyMessage={emptyMessage}
            />
          </Popover>
        )}
      </div>
    </Field>
  );
}

/** Forwarded-ref wrapper. Trigger is a <div>, matching Picker's DOMRef shape. */
export const MultiSelect = React.forwardRef(MultiSelectInner);
MultiSelect.displayName = 'MultiSelect';

export default MultiSelect;
