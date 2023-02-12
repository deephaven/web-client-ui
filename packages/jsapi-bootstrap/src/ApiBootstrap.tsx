import React, { createContext, useEffect, useState } from 'react';
import {
  LoadingOverlay,
  Modal,
  ModalBody,
  ModalHeader,
} from '@deephaven/components';
import type DhType from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/code-studio');

export const ApiContext = createContext<DhType | null>(null);

export type ApiBootstrapProps = {
  apiUrl: string;
  children: JSX.Element;
  failureElement?: JSX.Element;
  setGlobally?: boolean;
};

export function ApiBootstrap({
  apiUrl,
  children,
  failureElement,
  setGlobally = false,
}: ApiBootstrapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [api, setApi] = useState<DhType>();
  useEffect(() => {
    async function loadApi() {
      try {
        const dh: DhType = (await import(/* @vite-ignore */ apiUrl)).default;
        log.info('API bootstrapped from', apiUrl);
        setApi(dh);
        if (setGlobally) {
          log.debug('API set globally');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (globalThis as any).dh = dh;
        }
      } catch (e) {
        log.error('Unable to bootstrap API', e);
      }
      setIsLoading(false);
    }
    loadApi();
  }, [apiUrl, setGlobally]);

  if (isLoading) {
    return <LoadingOverlay />;
  }
  if (api == null) {
    return (
      failureElement ?? (
        <Modal isOpen className="modal-dialog-centered theme-bg-light">
          <ModalHeader closeButton={false}>
            Error: Unable to load API
          </ModalHeader>
          <ModalBody>
            <p className="text-break">
              Ensure the server is running and you are able to reach {apiUrl},
              then refresh the page.
            </p>
          </ModalBody>
        </Modal>
      )
    );
  }
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export default ApiBootstrap;
