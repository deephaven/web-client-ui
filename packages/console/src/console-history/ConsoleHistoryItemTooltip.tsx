import React, { type ReactElement } from 'react';
import { Content, Heading } from '@deephaven/components';
import { type ConsoleHistoryActionItem } from './ConsoleHistoryTypes';
import { getTimeString } from './ConsoleHistoryItemUtils';

interface ConsoleHistoryActionItemTooltipProps {
  item: ConsoleHistoryActionItem;
}

function CommandHistoryItemTooltip(
  props: ConsoleHistoryActionItemTooltipProps
): ReactElement {
  const { item } = props;
  const { startTime, serverStartTime, serverEndTime } = item;
  const endTime = item.endTime ?? Date.now();

  const timeString = getTimeString(startTime, endTime);

  const hasTimeString = Boolean(timeString);
  let serverTimeString = null;
  if (serverStartTime != null && serverEndTime != null) {
    // server provided times are in nanoseconds
    serverTimeString = getTimeString(serverStartTime, serverEndTime, 'ns');
  }
  const hasServerTimeString = Boolean(serverTimeString);

  return (
    <>
      <Heading>Execution Info</Heading>
      <Content>
        <div className="console-history-item-contextual-help-content">
          {hasTimeString && (
            <>
              <div>Elapsed time</div>
              <div>{timeString}</div>
            </>
          )}
          {hasServerTimeString && (
            <>
              <div>Server query time</div>
              <div>{serverTimeString}</div>
            </>
          )}
        </div>
      </Content>
    </>
  );
}

export default CommandHistoryItemTooltip;
