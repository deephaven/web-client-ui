import { Tooltip } from '@deephaven/components';
import { QueryConnectable, WorkerHeapInfo } from '@deephaven/jsapi-shim';
import React, { useEffect, useState, ReactElement, useRef } from 'react';
import { Plot, ChartTheme } from '@deephaven/chart';
import './SizeUsageUI.scss';
import classNames from 'classnames';

interface SIzeUsageUIProps {
  connection: QueryConnectable;
  UIParams: { defaultUpdateInterval: number; hoverUpdateInterval: number };
  bgMonitoring: boolean;

  // in seconds
  monitorDuration: number;
}

const SizeUsageUI = ({
  connection,
  UIParams,
  bgMonitoring,
  monitorDuration,
}: SIzeUsageUIProps): ReactElement => {
  const [freeMemory, setFreeMemory] = useState<number>(0);
  const [maxHeapSize, setMaxHeapSize] = useState<number>(999);
  const [totalHeapSize, setTotalHeapSize] = useState<number>(0);
  const [hover, setHover] = useState(false);

  const historyUsage = useRef<{ time: number[]; usage: number[] }>({
    time: [],
    usage: [],
  });

  const { defaultUpdateInterval, hoverUpdateInterval } = UIParams;

  const setUsage = (usage: WorkerHeapInfo) => {
    setFreeMemory(usage.freeMemory);
    setMaxHeapSize(usage.maximumHeapSize);
    setTotalHeapSize(usage.totalHeapSize);
  };

  useEffect(
    function setUsageUpdateInterval() {
      const fetchAndUpdate = async () => {
        const newUsage = await connection.getWorkerHeapInfo();

        if (bgMonitoring || hover) {
          const usage = newUsage.freeMemory / newUsage.maximumHeapSize;
          const time = Date.now();

          const past = historyUsage.current;
          while (
            past.time.length !== 0 &&
            time - past.time[0] > monitorDuration * 1000 * 1.5
          ) {
            past.time.shift();
            past.usage.shift();
          }

          past.time.push(time);
          past.usage.push(usage);

          historyUsage.current = past;
        } else {
          historyUsage.current = { time: [], usage: [] };
        }

        setUsage(newUsage);
      };
      fetchAndUpdate();

      const updateUsage = setInterval(
        fetchAndUpdate,
        hover ? hoverUpdateInterval : defaultUpdateInterval
      );
      return () => {
        clearInterval(updateUsage);
      };
    },
    [
      hover,
      hoverUpdateInterval,
      connection,
      defaultUpdateInterval,
      monitorDuration,
      bgMonitoring,
    ]
  );

  const toDecimalPlace = (num: number, dec: number) =>
    Math.round(num * 10 ** dec) / 10 ** dec;

  const decimalPlace = 2;
  const GbToByte = 1024 ** 3;

  const freeMemoryGB = toDecimalPlace(freeMemory / GbToByte, decimalPlace);
  const totalHeapGB = toDecimalPlace(totalHeapSize / GbToByte, decimalPlace);
  const maxHeapGB = toDecimalPlace(maxHeapSize / GbToByte, decimalPlace);
  const inUseGB = totalHeapGB - freeMemoryGB;

  const getRow = (text: string, size: string, bottomBorder = false) => (
    <div
      className={classNames(`heap-usage-info-row`, {
        'heading-bottom-border': bottomBorder,
      })}
    >
      <div>
        <h6
          style={{
            fontWeight: 'bold',
          }}
        >
          {text}
        </h6>
      </div>
      <div style={{}}>
        <h6>{size}</h6>
      </div>
    </div>
  );

  const timestamps = historyUsage.current.time;
  const usages = historyUsage.current.usage;
  const lastTimestamp = timestamps[timestamps.length - 1] ?? 0;
  return (
    <>
      <div
        className="max-memory"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div
          className="total-memory"
          style={{ width: `${(totalHeapSize * 100) / maxHeapSize}%` }}
        />
        <div
          className={classNames('used-memory', {
            'heap-overflow': (totalHeapSize - freeMemory) / maxHeapSize > 0.95,
          })}
          style={{
            width: `${((totalHeapSize - freeMemory) * 100) / maxHeapSize}%`,
          }}
        />

        <div className="memory-text">{maxHeapGB.toFixed(1)} GB</div>
      </div>

      <Tooltip>
        <div className="heap-tooltip">
          {getRow(
            'In use:',
            `${inUseGB.toFixed(decimalPlace)} of ${maxHeapGB.toFixed(
              decimalPlace
            )} GB`,
            true
          )}
          {getRow('Free:', `${freeMemoryGB.toFixed(decimalPlace)} GB`)}
          {getRow('Total:', `${totalHeapGB.toFixed(decimalPlace)} GB`)}
          {getRow('Max:', `${maxHeapGB.toFixed(decimalPlace)} GB`)}
          <div className="heap-plot">
            <Plot
              data={[
                {
                  x: [...timestamps],
                  y: [...usages],
                  type: 'scatter',
                  mode: 'lines',
                },
              ]}
              config={{ staticPlot: true, responsive: true }}
              style={{
                width: '196px',
                height: '100px',
              }}
              layout={{
                legend: false,
                margin: { l: 2, t: 2, r: 2, b: 2 },
                plot_bgcolor: 'transparent',
                paper_bgcolor: 'transparent',
                colorway: ['#4878ea'],
                xaxis: {
                  dtick: Math.round((monitorDuration * 1000) / 6),
                  gridcolor: ChartTheme.linecolor,
                  range: [
                    lastTimestamp - monitorDuration * 1000,
                    lastTimestamp,
                  ],
                  linecolor: ChartTheme.linecolor,
                  linewidth: 2,
                  mirror: true,
                },
                yaxis: {
                  dtick: 0.2,
                  gridcolor: ChartTheme.linecolor,
                  range: [0, 1],
                  linecolor: ChartTheme.linecolor,
                  linewidth: 2,
                  mirror: true,
                },
              }}
            />
          </div>
          <div className="heap-utilisation-text">
            <h6>% utilisation over {Math.round(monitorDuration / 60)} min.</h6>
          </div>
        </div>
      </Tooltip>
    </>
  );
};

export default SizeUsageUI;
