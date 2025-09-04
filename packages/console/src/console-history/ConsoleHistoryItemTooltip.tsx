import React, { type ReactElement, useMemo, memo } from 'react';
import { Content, Heading } from '@deephaven/components';
import { TimeUtils } from '@deephaven/utils';
import { type ConsoleHistoryActionItem } from './ConsoleHistoryTypes';

interface ConsoleHistoryActionItemTooltipProps {
  item: ConsoleHistoryActionItem;
}

const ConsoleHistoryItemTooltip = memo(
  (props: ConsoleHistoryActionItemTooltipProps): ReactElement => {
    const { item } = props;
    const { startTime, serverStartTime, serverEndTime } = item;
    const endTime = useMemo(() => item.endTime ?? Date.now(), [item.endTime]);

    const timeString = TimeUtils.formatConvertedDuration(startTime, endTime);

    const hasTimeString = Boolean(timeString);
    let serverTimeString = null;
    if (serverStartTime != null && serverEndTime != null) {
      // server provided times are in nanoseconds
      serverTimeString = TimeUtils.formatConvertedDuration(
        serverStartTime,
        serverEndTime,
        'ns'
      );
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
);

ConsoleHistoryItemTooltip.displayName = 'ConsoleHistoryItemTooltip';

export default ConsoleHistoryItemTooltip;
