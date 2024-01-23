import { useState, ReactElement, useRef, useCallback } from 'react';
import classNames from 'classnames';
import { Tooltip } from '@deephaven/components';
import type { QueryConnectable } from '@deephaven/jsapi-types';
import { Plot, useChartTheme } from '@deephaven/chart';
import Log from '@deephaven/log';
import { useAsyncInterval, useIsMountedRef } from '@deephaven/react-hooks';
import './HeapUsage.scss';

const log = Log.module('HeapUsage');

interface HeapUsageProps {
  connection: QueryConnectable;
  defaultUpdateInterval: number;
  hoverUpdateInterval: number;
  bgMonitoring?: boolean;

  // in millis
  monitorDuration: number;
}

function HeapUsage({
  connection,
  defaultUpdateInterval,
  hoverUpdateInterval,
  bgMonitoring = true,
  monitorDuration,
}: HeapUsageProps): ReactElement {
  const chartTheme = useChartTheme();

  const [memoryUsage, setMemoryUsage] = useState({
    freeMemory: 0,
    maximumHeapSize: 999,
    totalHeapSize: 0,
  });

  const [isOpen, setIsOpen] = useState(false);

  const historyUsage = useRef<{ timestamps: number[]; usages: number[] }>({
    timestamps: [],
    usages: [],
  });

  const isMountedRef = useIsMountedRef();

  const setUsageUpdateInterval = useCallback(async () => {
    try {
      const newUsage = await connection.getWorkerHeapInfo();

      if (!isMountedRef.current) {
        return;
      }

      setMemoryUsage(newUsage);

      if (bgMonitoring || isOpen) {
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
    } catch (e) {
      log.warn('Unable to get heap usage', e);
    }
  }, [connection, isMountedRef, bgMonitoring, isOpen, monitorDuration]);

  useAsyncInterval(
    setUsageUpdateInterval,
    isOpen ? hoverUpdateInterval : defaultUpdateInterval
  );

  const toDecimalPlace = (num: number, dec: number): number =>
    Math.round(num * 10 ** dec) / 10 ** dec;

  const decimalPlace = 2;
  const GbToByte = 1024 ** 3;

  const { freeMemory, totalHeapSize, maximumHeapSize } = memoryUsage;

  const freeMemoryGB = toDecimalPlace(freeMemory / GbToByte, decimalPlace);
  const totalHeapGB = toDecimalPlace(totalHeapSize / GbToByte, decimalPlace);
  const maxHeapGB = toDecimalPlace(maximumHeapSize / GbToByte, decimalPlace);
  const inUseGB = totalHeapGB - freeMemoryGB;

  const getRow = (
    text: string,
    size: string,
    bottomBorder = false
  ): JSX.Element => (
    <div
      className={classNames(`heap-usage-info-row`, {
        'heading-bottom-border': bottomBorder,
      })}
    >
      <div className="font-weight-bold">{text}</div>
      <div>{size}</div>
    </div>
  );

  const { timestamps, usages } = historyUsage.current;

  const lastTimestamp = timestamps[timestamps.length - 1] ?? 0;

  const totalPercentage = totalHeapSize / maximumHeapSize;
  const usedPercentage = (totalHeapSize - freeMemory) / maximumHeapSize;

  return (
    <div className="max-memory">
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

      <Tooltip
        onEntered={(): void => setIsOpen(true)}
        onExited={(): void => setIsOpen(false)}
        interactive
      >
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
                margin: { l: 2, t: 2, r: 2, b: 2 },
                plot_bgcolor: 'transparent',
                paper_bgcolor: 'transparent',
                colorway: ['#4878ea'],
                xaxis: {
                  dtick: Math.round(monitorDuration / 6),
                  gridcolor: chartTheme.linecolor,
                  range: [lastTimestamp - monitorDuration, lastTimestamp],
                  linecolor: chartTheme.linecolor,
                  linewidth: 2,
                  mirror: true,
                },
                yaxis: {
                  dtick: 0.2,
                  gridcolor: chartTheme.linecolor,
                  range: [0, 1],
                  linecolor: chartTheme.linecolor,
                  linewidth: 2,
                  mirror: true,
                },
              }}
            />
          </div>
          <div className="heap-utilisation-text">
            % utilization over {Math.round(monitorDuration / 1000 / 60)} min.
          </div>
        </div>
      </Tooltip>
    </div>
  );
}

export default HeapUsage;
