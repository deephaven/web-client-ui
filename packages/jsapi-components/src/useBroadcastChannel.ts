import {
  BROADCAST_CHANNEL_NAME,
  isMessage,
  Message,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import { useEffect, useMemo } from 'react';

const log = Log.module('useBroadcastChannel');

export function useBroadcastChannel(
  onEvent: (event: MessageEvent<Message<unknown>>) => void = EMPTY_FUNCTION,
  name = BROADCAST_CHANNEL_NAME
) {
  const channel = useMemo(() => new BroadcastChannel(name), [name]);
  useEffect(
    () => () => {
      channel.close();
    },
    [channel]
  );

  useEffect(() => {
    channel.onmessage = (event: MessageEvent) => {
      const { data } = event;
      if (!isMessage(data)) {
        log.debug('Ignoring non-deephaven message', data);
        return;
      }
      log.debug('event received', data);
      onEvent(event);
    };
  }, [channel, onEvent]);

  return channel;
}

export default useBroadcastChannel;
