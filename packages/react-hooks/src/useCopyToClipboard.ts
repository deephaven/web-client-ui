import { useEffect, useState, useRef } from 'react';
import { CopyClipboardUtils } from '@deephaven/utils';
import Log from '@deephaven/log';

const TIMEOUT_DELAY = 3500;
const log = Log.module('useCopyToClipboard');

export default function useCopyToClipboard(): [
  boolean,
  (value: string) => void
] {
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function copyToClipboard(value: string): void {
    CopyClipboardUtils.copyToClipboard(value)
      .then(() => {
        setCopied(true);
      })
      .catch(e => log.error(`Unable to copy ${value}`, e));
  }

  useEffect(() => {
    if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    copiedTimeout.current = setTimeout(() => {
      setCopied(false);
    }, TIMEOUT_DELAY);
    return () => {
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    };
  }, [copied]);

  return [copied, copyToClipboard];
}
