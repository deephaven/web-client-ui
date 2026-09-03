import { chromium, type FullConfig } from '@playwright/test';
import baseGlobalSetup from './globalSetup';

/**
 * Global setup used only when recording a test (see playwright-record.config.ts).
 *
 * When running e2e tests against the local Vite dev server, the very first page
 * load triggers an on-demand compile of the app's modules, which can leave the
 * screen blank/white for ~10s. If we record video straight away, that blank
 * period ends up at the start of the clip.
 *
 * To avoid that, we load the base URL once here so Vite compiles and caches the
 * main app chunks *before* the recorded test runs. The recorded run then loads
 * the already-compiled app quickly, so the video starts close to when the UI is
 * actually visible.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  await baseGlobalSetup(config);

  const baseURL = config.projects[0]?.use?.baseURL;
  if (baseURL == null) {
    return;
  }

  // Warming up only matters for a local dev server.
  if (new URL(baseURL).hostname !== 'localhost') {
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[record] Warming up dev server at ${baseURL} ...`);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(baseURL, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    // Give Vite a chance to finish compiling/serving the main chunks.
    await page.waitForLoadState('networkidle', { timeout: 120_000 });
    // eslint-disable-next-line no-console
    console.log('[record] Dev server warm-up complete.');
  } catch (e) {
    // Warm-up is only an optimization - let the test itself report real failures.
    // eslint-disable-next-line no-console
    console.warn(`[record] Dev server warm-up skipped: ${e}`);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
