import Log from '@deephaven/log';

const log = Log.module('DownloadServiceWorkerUtils');

class DownloadServiceWorkerUtils {
  static DOWNLOAD_PATH = '/download/';

  static registerOnLoaded(): void {
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if BASE_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return;
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        const swUrl = new URL(
          `${import.meta.env.BASE_URL ?? ''}download/serviceWorker.js`,
          window.location.href
        );

        navigator.serviceWorker
          .register(swUrl)
          .then(reg => {
            reg.update();
            log.info('Registering service worker on ', swUrl, reg);
          })
          .catch(err => {
            log.error('Failed to register service worker', err);
          });
      });
    } else {
      log.info('Service worker is not supported.');
    }
  }

  static async getServiceWorker(): Promise<ServiceWorker> {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      const swReg = regs.find(reg =>
        reg.scope.endsWith(DownloadServiceWorkerUtils.DOWNLOAD_PATH)
      );
      if (swReg && swReg.active) {
        log.info('Download service worker is active.');
        return swReg.active;
      }
      throw new Error('Can not find download service worker.');
    }
    throw new Error('Download service worker is not available.');
  }

  static unregisterSW(): undefined {
    return undefined;
  }
}
export default DownloadServiceWorkerUtils;
