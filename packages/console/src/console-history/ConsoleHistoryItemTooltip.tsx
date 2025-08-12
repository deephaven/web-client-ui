import React, { Component, type ReactElement } from 'react';
import { ContextualHelp, Tooltip } from '@deephaven/components';
import { TimeUtils } from '@deephaven/utils';
import { ConsoleHistoryActionItem } from './ConsoleHistoryTypes';
import { func } from 'node_modules/@types/prop-types';

interface ConsoleHistoryActionItemTooltipProps {
  item: ConsoleHistoryActionItem;
}

const convertedDiff = (diff: number): string => {
  if (diff < 60) {
    return `${diff.toFixed(2)}s`;
  }
  if (diff < 3600) {
    return `${(diff / 60).toFixed(2)}m`;
  }
  return `${(diff / 3600).toFixed(2)}h`;
};

const getTimeString = (
  startTime: string | number | undefined,
  endTime: string | number | undefined
): string | null => {
  // seconds, minutes, hours
  // rounded to two decimal places

  if (startTime == null || endTime === '' || endTime === 0 || endTime == null) {
    return null;
  }
  const deltaTime =
    (new Date(endTime).valueOf() - new Date(startTime).valueOf()) / 1000;

  return convertedDiff(deltaTime);
};

function CommandHistoryItemTooltip(
  props: ConsoleHistoryActionItemTooltipProps
): ReactElement {
  const { item } = props;
  const { startTime, serverStartTime, serverEndTime } = item;
  const endTime = item.endTime ?? Date.now();

  console.log('CommandHistoryItemTooltip render', {
    startTime,
    endTime,
    serverStartTime,
    serverEndTime,
  });

  const timeString = getTimeString(startTime, endTime);

  const hasTimeString = Boolean(timeString);
  const hasServerTimeString = Boolean(serverStartTime && serverEndTime);
  let serverTimeString = null;
  if (serverStartTime && serverEndTime) {
    // server provided times are in nanoseconds, convert to seconds
    const serverTimeDiff = (serverEndTime - serverStartTime) / 1e9; // convert nanoseconds to seconds
    serverTimeString = convertedDiff(serverTimeDiff);
  }

  return (
    <ContextualHelp variant="info">
      <div className="console-history-item-tooltip">
        {hasTimeString && (
          <>
            <div>Elapsed time</div>
            <div>{timeString}</div>
          </>
        )}
        {hasServerTimeString && (
          <>
            <div>Elapsed server time</div>
            <div>{serverTimeString}</div>
          </>
        )}
      </div>
    </ContextualHelp>
  );
}

export default CommandHistoryItemTooltip;
