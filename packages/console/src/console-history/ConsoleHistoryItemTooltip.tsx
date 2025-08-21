import React, {
  Component,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import {
  Content,
  ContextualHelp,
  Heading,
  Tooltip,
} from '@deephaven/components';
import { TimeUtils } from '@deephaven/utils';
import { ConsoleHistoryActionItem } from './ConsoleHistoryTypes';
import { func } from 'node_modules/@types/prop-types';
import { useResizeObserver } from '@deephaven/react-hooks';

interface ConsoleHistoryActionItemTooltipProps {
  item: ConsoleHistoryActionItem;
  onOpenChange: (isOpen: boolean) => void;
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

function useForceRepositionOnViewportResize() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => {
      // Slight delay to allow layout to settle
      requestAnimationFrame(() => {
        setTick(t => t + 1); // Force re-render
      });
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handler);
    }

    window.addEventListener('orientationchange', handler);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handler);
      }
      window.removeEventListener('orientationchange', handler);
    };
  }, []);
}

function CommandHistoryItemTooltip(
  props: ConsoleHistoryActionItemTooltipProps
): ReactElement {
  useForceRepositionOnViewportResize();
  const { item } = props;
  const { startTime, serverStartTime, serverEndTime } = item;
  const endTime = item.endTime ?? Date.now();

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
    <ContextualHelp
      variant="info"
      onOpenChange={props.onOpenChange}
      UNSAFE_className="console-history-item-contextual-help"
    >
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
              <div>Elapsed server time</div>
              <div>{serverTimeString}</div>
            </>
          )}
        </div>
      </Content>
    </ContextualHelp>
  );
}

export default CommandHistoryItemTooltip;
