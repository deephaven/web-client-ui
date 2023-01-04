import React, { useEffect, useRef, useState } from 'react';
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
  onDelete(group: ColumnHeaderGroup): void;
  onColorChange(group: ColumnHeaderGroup, color: string | undefined): void;
  onNameChange(group: ColumnHeaderGroup, name: string): void;
  validateName(name: string): string;
}

export default function VisibilityOrderingGroup(
  props: VisibilityOrderingGroupProps
): JSX.Element {
  const { group, onDelete, onColorChange, onNameChange, validateName } = props;
  const { isNew } = group;
  const nameInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(isNew ? '' : group.name);
  const [isEditing, setIsEditing] = useState(isNew);
  const [hasTyped, setHasTyped] = useState(false);
  const nameValidationError = name !== group.name ? validateName(name) : '';
  const isValid = (isNew && !hasTyped) || nameValidationError === '';

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

  const handleConfirm = () => {
    if (isValid) {
      onNameChange(group, name);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (isNew) {
      onDelete(group);
      return;
    }
    setName(group.name);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent): void => {
    setHasTyped(true);
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
                />
                <FontAwesomeIcon
                  className="color-swatch"
                  icon={dhSquareFilled}
                  color={group.color}
                  transform="shrink-2"
                />
              </span>
            ) : (
              vsPaintcan
            )
          }
          tooltip="Set color"
          onClick={() => {
            colorInputRef.current?.click();
          }}
        />
        <input
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
      </span>
    </div>
  );
}
