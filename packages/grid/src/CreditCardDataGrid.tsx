'use client';

import { useEffect, useState } from 'react';
import Grid from './Grid';
import CreditCardDataGridModel from './CreditCardDataGridModel';

function CreditCardData(): JSX.Element {
  const [model, setModel] = useState<CreditCardDataGridModel | null>(null);
  const [parsedData, setParsedData] = useState<unknown[][]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      const rows = text
        .split('\n')
        .filter(Boolean)
        .map(row => row.split(','));
      setParsedData(rows as unknown[][]);
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (parsedData.length > 0) {
      const newModel = new CreditCardDataGridModel(parsedData);
      setModel(newModel);
    }
  }, [parsedData]);

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      {model !== null && (
        <div className="grid">
          <Grid model={model} />
        </div>
      )}
    </div>
  );
}

export default CreditCardData;
