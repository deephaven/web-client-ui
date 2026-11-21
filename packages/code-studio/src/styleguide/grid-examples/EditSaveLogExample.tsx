import React, { type ReactElement, useCallback, useState } from 'react';
import {
  Grid,
  type GridThemeType,
  MockGridModel,
  type ModelIndex,
} from '@deephaven/grid';

// Fixed metrics so tests/grid-editing.spec.ts can find cells on the canvas
const THEME: Partial<GridThemeType> = {
  autoSizeColumns: false,
  columnWidth: 100,
  rowHeight: 30,
  columnHeaderHeight: 30,
  rowHeaderWidth: 0,
};

/**
 * Logs every cell save, and rejects values containing "fail".
 */
class SaveLogModel extends MockGridModel {
  private onSave: (save: string) => void;

  constructor(onSave: (save: string) => void) {
    super({ rowCount: 10, columnCount: 5, isEditable: true });
    this.onSave = onSave;
  }

  async setValueForCell(
    column: ModelIndex,
    row: ModelIndex,
    value: string
  ): Promise<void> {
    this.onSave(`${column},${row}=${value}`);
    if (value.includes('fail')) {
      throw new Error(`Failed to save ${value}`);
    }
    await super.setValueForCell(column, row, value);
  }
}

/**
 * An editable grid that lists each save and error, so e2e tests can check
 * that an edit is saved exactly once.
 */
function EditSaveLogExample(): ReactElement {
  const [saves, setSaves] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [model] = useState(
    () => new SaveLogModel(save => setSaves(prev => [...prev, save]))
  );
  const handleError = useCallback((error?: Error) => {
    setErrors(prev => [...prev, `${error?.message}`]);
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', gap: 16 }}>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <Grid model={model} theme={THEME} onError={handleError} />
      </div>
      <div>
        Saves
        <ol data-testid="edit-save-log-saves">
          {saves.map((save, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={i}>{save}</li>
          ))}
        </ol>
        Errors
        <ol data-testid="edit-save-log-errors">
          {errors.map((error, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={i}>{error}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default EditSaveLogExample;
