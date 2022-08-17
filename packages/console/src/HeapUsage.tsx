import { Tooltip } from '@deephaven/components';
import { QueryConnectable } from '@deephaven/jsapi-shim';
import React, { useEffect, useState, ReactElement, useRef } from 'react';
import { Plot, ChartTheme } from '@deephaven/chart';
import './HeapUsage.scss';
import classNames from 'classnames';

interface HeapUsageProps {
  connection: QueryConnectable;
  defaultUpdateInterval: number;
  hoverUpdateInterval: number;
  bgMonitoring?: boolean;

  // in millis
  monitorDuration: number;
}

const HeapUsage = ({
  connection,
  defaultUpdateInterval,
  hoverUpdateInterval,
  bgMonitoring = true,
  monitorDuration,
}: HeapUsageProps): ReactElement => {
  const [memoryUsage, setMemoryUsage] = useState({
    freeMemory: 0,
    maximumHeapSize: 999,
    totalHeapSize: 0,
  });

  const [hover, setHover] = useState(false);

  const historyUsage = useRef<{ timestamps: number[]; usages: number[] }>({
    timestamps: [],
    usages: [],
  });

  useEffect(
    function setUsageUpdateInterval() {
      const fetchAndUpdate = async () => {
        const newUsage = await connection.getWorkerHeapInfo();
        setMemoryUsage(newUsage);

        if (bgMonitoring || hover) {
          const currentUsage =
            (newUsage.totalHeapSize - newUsage.freeMemory) /
            newUsage.maximumHeapSize;
          const currentTime = Date.now();

          const { timestamps, usages } = historyUsage.current;
          while (
            timestamps.length !== 0 &&
            currentTime - timestamps[0] > monitorDuration * 1.5
          ) {
            timestamps.shift();
            usages.shift();
          }

          timestamps.push(currentTime);
          usages.push(currentUsage);
        } else {
          historyUsage.current = { timestamps: [], usages: [] };
        }
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

  const { freeMemory, totalHeapSize, maximumHeapSize } = memoryUsage;

  const freeMemoryGB = toDecimalPlace(freeMemory / GbToByte, decimalPlace);
  const totalHeapGB = toDecimalPlace(totalHeapSize / GbToByte, decimalPlace);
  const maxHeapGB = toDecimalPlace(maximumHeapSize / GbToByte, decimalPlace);
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
      <div>
        {/* <h6> */}
        {size}
        {/* </h6> */}
      </div>
    </div>
  );

  const { timestamps, usages } = historyUsage.current;

  const lastTimestamp = timestamps[timestamps.length - 1] ?? 0;

  const totalPercentage = totalHeapSize / maximumHeapSize;
  const usedPercentage = (totalHeapSize - freeMemory) / maximumHeapSize;

  return (
    <>
      <div
        className="max-memory"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div
          className="total-memory"
          style={{
            width: `calc(${totalPercentage * 100}% - ${totalPercentage * 2}px`,
          }}
        />
        <div
          className={classNames('used-memory', {
            'heap-overflow':
              (totalHeapSize - freeMemory) / maximumHeapSize > 0.95,
          })}
          style={{
            width: `calc(${usedPercentage * 100}% - ${usedPercentage * 2}px`,
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
                  dtick: Math.round(monitorDuration / 6),
                  gridcolor: ChartTheme.linecolor,
                  range: [lastTimestamp - monitorDuration, lastTimestamp],
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
            <h6>
              % utilization over {Math.round(monitorDuration / 1000 / 60)} min.
            </h6>
          </div>
        </div>
      </Tooltip>
    </>
  );
};

export default HeapUsage;
