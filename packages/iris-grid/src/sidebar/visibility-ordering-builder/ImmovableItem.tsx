import React from 'react';

export default function ImmovableItem({
  columnName,
}: {
  columnName: string;
}): JSX.Element {
  return (
    <div className="visibility-ordering-list-item immovable" key={columnName}>
      <div className="column-item">
        <span className="column-name">{columnName}</span>
      </div>
    </div>
  );
}
