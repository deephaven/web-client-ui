import { FullConfig } from '@playwright/test';
import { logBrowserInfo } from './utils';

async function globalSetup(_config: FullConfig): Promise<void> {
  await logBrowserInfo();

  // eslint-disable-next-line no-console
  console.log('Node version:', process.version);
}

export default globalSetup;
