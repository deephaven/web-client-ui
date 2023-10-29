import React, { useEffect, useRef, useState, useCallback } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, ThemeExport } from '@deephaven/components';
import {
  dhSquareFilled,
  vsCheck,
  vsChromeClose,
  vsEdit,
  vsPaintcan,
  vsTrash,
} from '@deephaven/icons';
import type ColumnHeaderGroup from '../../ColumnHeaderGroup';
import './VisibilityOrderingGroup.scss';

interface VisibilityOrderingGroupProps {
  group: ColumnHeaderGroup;
  onDelete: (group: ColumnHeaderGroup) => void;
  onColorChange: (group: ColumnHeaderGroup, color: string | undefined) => void;
  onNameChange: (group: ColumnHeaderGroup, name: string) => void;
  validateName: (name: string) => string;
}

export default function VisibilityOrderingGroup(
  props: VisibilityOrderingGroupProps
): JSX.Element {
  const { group, onDelete, onColorChange, onNameChange, validateName } = props;
  const { isNew } = group;
  const groupRef = useRef(group);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [isColorInputOpen, setIsColorInputOpen] = useState(false);
  const [name, setName] = useState(isNew ? '' : group.name);
  const [isEditing, setIsEditing] = useState(isNew);
  const [shouldValidate, setShouldValidate] = useState(false);
  const nameValidationError = name !== group.name ? validateName(name) : '';
  const isValid = (isNew && !shouldValidate) || nameValidationError === '';
  const colorInputBlurHandler = useCallback(() => {
    setIsColorInputOpen(false);
  }, []);

  useEffect(
    function focusEditInput() {
      if (isEditing && nameInputRef.current) {
        // This is solely b/c RTL doesn't count select as focusing the element
        // Might be fixed in v13+ of RTL
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    },
    [isEditing]
  );

  useEffect(
    function deleteNewOnUnmount() {
      return () => {
        if (groupRef.current.isNew) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          onDelete(groupRef.current);
        }
      };
    },
    [onDelete]
  );

  useEffect(
    function openColorInput() {
      if (isColorInputOpen) {
        colorInputRef.current?.click();
        // Mostly for testing. Chrome seems to not give the hidden input focus
        // Really would only affect screen readers
        colorInputRef.current?.focus();

        /**
         * Adding this event handler is for Firefox on Mac
         * There seems to be buggy behavior when multiple color inputs are on the same page
         * Clicking between the inputs without closing the previous causes a bad state
         * The user gets to a point where they can't open most of the pickers
         * https://bugzilla.mozilla.org/show_bug.cgi?id=1618418
         * https://bugzilla.mozilla.org/show_bug.cgi?id=975468
         * Instead, we remove the color input when any focus is returned to the window
         * This causes Firefox on Mac to mostly operate correctly
         * Firefox seems to ignore the first click back into the window and emit no event
         * So opening a color picker when another is open requires 2 clicks in Firefox
         */
        window.addEventListener('click', colorInputBlurHandler, true);
      }

      return () =>
        window.removeEventListener('click', colorInputBlurHandler, true);
    },
    [isColorInputOpen, colorInputBlurHandler]
  );

  const handleConfirm = (): void => {
    if (isValid) {
      onNameChange(group, name);
      setIsEditing(false);
    }
  };

  const handleCancel = (): void => {
    if (isNew) {
      onDelete(group);
      return;
    }
    setName(group.name);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent): void => {
    setShouldValidate(true);
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleConfirm();
    }

    if (e.key === ' ') {
      e.stopPropagation();
    }

    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <>
        <div className="editing-container">
          <input
            ref={nameInputRef}
            className={classNames('form-control', {
              'is-invalid': !isValid,
            })}
            value={name}
            placeholder="Group Name"
            onChange={e => setName(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={() => setShouldValidate(true)}
          />
          <Button
            kind="ghost"
            icon={vsCheck}
            tooltip="Confirm"
            onClick={handleConfirm}
          />
          <Button
            kind="ghost"
            icon={vsChromeClose}
            tooltip="Cancel"
            onClick={handleCancel}
          />
        </div>
        {!isValid && (
          <p className="mb-0 validate-label-error text-danger">
            {nameValidationError}
          </p>
        )}
      </>
    );
  }

  return (
    <div className="group-name-wrapper">
      <span className="column-name">{name}</span>
      <Button
        className="p-1 mx-1"
        kind="ghost"
        icon={vsEdit}
        tooltip="Edit"
        onClick={() => {
          setIsEditing(true);
        }}
      />

      <span className="right-buttons">
        <Button
          kind="ghost"
          icon={vsTrash}
          tooltip="Delete group"
          onClick={() => onDelete(group)}
        />
        <Button
          kind="ghost"
          className="color-swatch mr-1"
          icon={
            group.color !== undefined ? (
              <span className="fa-layers">
                <FontAwesomeIcon
                  className="color-swatch"
                  icon={dhSquareFilled}
                  color={ThemeExport.white}
                  transform="down-1"
                />
                <FontAwesomeIcon
                  className="color-swatch"
                  icon={dhSquareFilled}
                  color={group.color}
                  transform="shrink-2 down-1"
                />
              </span>
            ) : (
              vsPaintcan
            )
          }
          tooltip="Set color"
          /**
           * Toggle to close the picker on Chrome
           * Prevents Firefox on Mac from getting into a stuck state
           * Does not close on Firefox b/c the picker stays open when the element is removed
           */
          onClick={() => setIsColorInputOpen(val => !val)}
        />
        {isColorInputOpen && (
          <>
            <input
              aria-label="Color input"
              ref={colorInputRef}
              type="color"
              list="presetColors"
              value={group.color ?? ThemeExport['content-bg']}
              style={{
                visibility: 'hidden',
                width: 0,
                height: 0,
                padding: 0,
                border: 0,
              }}
              onChange={e => {
                group.color = e.target.value;
                onColorChange(group, e.target.value);
              }}
            />
            <datalist id="presetColors">
              <option>{ThemeExport['content-bg']}</option>
              <option>{ThemeExport.primary}</option>
              <option>{ThemeExport.foreground}</option>
              <option>{ThemeExport.green}</option>
              <option>{ThemeExport.yellow}</option>
              <option>{ThemeExport.orange}</option>
              <option>{ThemeExport.red}</option>
              <option>{ThemeExport.purple}</option>
              <option>{ThemeExport.blue}</option>
              <option>{ThemeExport['gray-400']}</option>
            </datalist>
          </>
        )}
      </span>
    </div>
  );
}
