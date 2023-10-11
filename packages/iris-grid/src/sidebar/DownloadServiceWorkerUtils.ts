import Log from '@deephaven/log';

const log = Log.module('DownloadServiceWorkerUtils');

class DownloadServiceWorkerUtils {
  static serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Register the download service worker at the specified URL
   * Will unregister any existing service worker if register is called multiple times
   * @param url The URL of the service worker file
   */
  static register(url: URL): void {
    if (DownloadServiceWorkerUtils.serviceWorkerRegistration) {
      DownloadServiceWorkerUtils.unregisterSW();
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(url)
        .then(reg => {
          reg.update();
          DownloadServiceWorkerUtils.serviceWorkerRegistration = reg;
          log.info('Registering service worker on ', url, reg);
        })
        .catch(err => {
          log.error('Failed to register service worker', err);
        });
    } else {
      log.info('Service worker is not supported.');
    }
  }

  static async getServiceWorker(): Promise<ServiceWorker> {
    if ('serviceWorker' in navigator) {
      const swReg = DownloadServiceWorkerUtils.serviceWorkerRegistration;
      if (swReg && swReg.active) {
        log.info('Download service worker is active.');
        return swReg.active;
      }
      throw new Error('Can not find download service worker.');
    }
    throw new Error('Download service worker is not available.');
  }

  static unregisterSW(): void {
    DownloadServiceWorkerUtils.serviceWorkerRegistration?.unregister();
  }
}

export default DownloadServiceWorkerUtils;
