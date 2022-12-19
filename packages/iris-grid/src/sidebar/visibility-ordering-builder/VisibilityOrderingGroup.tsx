import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@deephaven/components';
import {
  dhSquareFilled,
  vsCheck,
  vsChromeClose,
  vsEdit,
  vsPaintcan,
  vsTrash,
} from '@deephaven/icons';
import type ColumnHeaderGroup from '../../ColumnHeaderGroup';

interface VisibilityOrderingGroupProps {
  group: ColumnHeaderGroup;
  onDelete(group: ColumnHeaderGroup): void;
  onColorChange(group: ColumnHeaderGroup, color: string | undefined): void;
  onNameChange(group: ColumnHeaderGroup, name: string): void;
  validateName(name: string): boolean;
  isNew: boolean;
}

export default function VisibilityOrderingGroup(
  props: VisibilityOrderingGroupProps
): JSX.Element {
  const {
    group,
    onDelete,
    onColorChange,
    onNameChange,
    validateName,
    isNew,
  } = props;
  const nameInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(group.name);
  const [isEditing, setIsEditing] = useState(isNew);
  const isValid =
    (isEditing && name === group.name) ||
    (name !== group.name && validateName(name));

  useEffect(
    function focusEditInput() {
      if (isEditing && nameInputRef.current) {
        nameInputRef.current.select();
      }
    },
    [isEditing]
  );

  if (isEditing) {
    const handleConfirm = () => {
      if (isValid) {
        onNameChange(group, name);
        setIsEditing(false);
      }
    };

    const handleCancel = () => {
      setName(group.name);
      setIsEditing(false);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent): void => {
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

    return (
      <div className="group-editing py-1">
        <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <input
            ref={nameInputRef}
            className={classNames('form-control', 'mr-1', {
              'is-invalid': !isValid,
            })}
            style={{ flexGrow: 1 }}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleEditKeyDown}
          />
          <Button
            kind="ghost"
            className="p-1"
            icon={vsCheck}
            tooltip="Confirm"
            onClick={handleConfirm}
          />
          <Button
            kind="ghost"
            className="p-1"
            icon={vsChromeClose}
            tooltip="Cancel"
            onClick={handleCancel}
          />
        </div>
        {!isValid && (
          <p className="mb-0 validate-label-error text-danger">
            Invalid or duplicate name
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {name}
      <Button
        className="p-1 mx-1"
        kind="ghost"
        icon={vsEdit}
        tooltip="Edit"
        onClick={() => {
          setIsEditing(true);
        }}
      />
      <span style={{ float: 'right' }}>
        <Button
          className="p-1"
          kind="ghost"
          icon={vsTrash}
          tooltip="Delete group"
          onClick={() => onDelete(group)}
        />
        <Button
          className="p-1"
          kind="ghost"
          icon={
            group.color !== undefined ? (
              <FontAwesomeIcon icon={dhSquareFilled} color={group.color} />
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
          value={group.color}
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
      </span>
    </>
  );
}
