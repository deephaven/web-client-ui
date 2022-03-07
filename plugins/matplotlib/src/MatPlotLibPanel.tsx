import React, { useEffect, useState } from 'react';
import './MatPlotLibPanel.scss';

export type MatPlotLibWidget = {
  type: string;
  getDataAsBase64: () => string;
};

export type MatPlotLibPanelProps = {
  fetch: () => Promise<MatPlotLibWidget>;
};

export type MatPlotLibPanelState = {
  imageData?: string;
};

/**
 * Displays a rendered matplotlib from the server
 */
export const MatPlotLibPanel = (props: MatPlotLibPanelProps): JSX.Element => {
  const { fetch } = props;
  const [imageSrc, setImageSrc] = useState<string>();

  useEffect(() => {
    async function fetchData() {
      const widget = await fetch();
      const imageData = await widget.getDataAsBase64();
      setImageSrc(`data:image/png;base64,${imageData}`);
    }
    fetchData();
  }, [fetch]);

  return (
    <div className="mat-plot-lib-panel">
      {imageSrc && <img src={imageSrc} alt="MatPlotLib render" />}
    </div>
  );
};

MatPlotLibPanel.COMPONENT = 'MatPlotLibPanel';

export default MatPlotLibPanel;
