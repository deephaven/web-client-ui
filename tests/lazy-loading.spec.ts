import { test, expect, Request } from '@playwright/test';
import { openPlot } from './utils';

/**
 * Checks the size of the response body of a request
 * If the response body size is 0, the request is not checked
 * This seems to happen for Safari sometimes
 *
 * @param request The request object. Playwright provides size on the request, not the response
 * @param size The minimum size in bytes
 */
async function expectResponseSize(request: Request | undefined, size: number) {
  if (!request) {
    throw new Error('Request is undefined');
  }

  const responseSize = (await request.sizes()).responseBodySize;

  // Safari doesn't seem to provide response size for some requests
  if (responseSize > 0) {
    expect(responseSize).toBeGreaterThan(size);
  }
}

test('lazy loads plotly', async ({ page }) => {
  const requests: Request[] = [];
  page.on('request', req => requests.push(req));

  await page.goto('');
  await page.waitForLoadState('networkidle');

  expect(requests.some(req => req.url().includes('assets/plotly'))).toBe(false);

  await openPlot(page, 'simple_plot');

  const plotlyRequest = requests.find(req =>
    req.url().includes('assets/plotly')
  );
  expect(plotlyRequest).toBeDefined();
  await expectResponseSize(plotlyRequest, 300 * 1000); // 300kB
});

test('lazy loads mathjax', async ({ page }) => {
  const requests: Request[] = [];
  page.on('request', req => requests.push(req));

  await page.goto('');
  await page.waitForLoadState('networkidle');

  expect(requests.some(req => req.url().includes('assets/mathjax'))).toBe(
    false
  );

  const controlsButton = page.getByText('Controls');
  await controlsButton.click();
  const markdownButton = page.getByText('Markdown Widget');
  await markdownButton.click();

  await expect(page.locator('.markdown-panel')).toBeVisible();
  await expect(page.locator('.markdown-panel .loading-spinner')).toHaveCount(0);

  const mathjaxRequest = requests.find(req =>
    req.url().includes('assets/mathjax')
  );
  expect(mathjaxRequest).toBeDefined();
  await expectResponseSize(mathjaxRequest, 500 * 1000); // 500kB
});
