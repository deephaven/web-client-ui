import Log from '@deephaven/log';

const log = Log.module('DownloadServiceWorkerUtils');

class DownloadServiceWorkerUtils {
  // The trailing slash is needed to match the scope of the service worker
  static DOWNLOAD_PATH = new URL('./download/', document.baseURI);

  static SERVICE_WORKER_URL = new URL(
    `./download/serviceWorker.js`,
    document.baseURI
  );

  static serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  static registerOnLoaded(): void {
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if BASE_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(DownloadServiceWorkerUtils.SERVICE_WORKER_URL)
        .then(reg => {
          reg.update();
          DownloadServiceWorkerUtils.serviceWorkerRegistration = reg;
          log.info(
            'Registering service worker on ',
            DownloadServiceWorkerUtils.SERVICE_WORKER_URL,
            reg
          );
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
