import { FullConfig } from '@playwright/test';
import { logBrowserInfo } from './utils';

async function globalSetup(_config: FullConfig): Promise<void> {
  await logBrowserInfo();
}

export default globalSetup;
