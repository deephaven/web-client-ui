import { test, expect, type Page, type Request } from '@playwright/test';
import { openPlot } from './utils';

/**
 * Chunk names are chosen by the bundler, so heavy libraries are identified by
 * a string that only appears in their code.
 */
const LIBRARY_MARKERS = {
  plotly: 'plotly_afterplot',
  // Plotly bundles its own MathJax integration, so match a MathJax internal
  mathjax: 'outputJax',
  monaco: 'editorWorkerService',
} as const;

function isJsAsset(request: Request): boolean {
  return /\/assets\/[^?]+\.js(\?|$)/.test(request.url());
}

/**
 * Finds the first JS asset whose response body contains the marker
 * @param requests The requests to search
 * @param marker The string identifying the library
 */
async function findChunkContaining(
  requests: Request[],
  marker: string
): Promise<Request | undefined> {
  const matches = await Promise.all(
    requests.filter(isJsAsset).map(async request => {
      const response = await request.response();
      const body = (await response?.text().catch(() => '')) ?? '';
      return body.includes(marker) ? request : undefined;
    })
  );
  return matches.find(request => request != null);
}

/**
 * Checks the size of the response body of a request
 * If the response body size is 0, the request is not checked
 * This seems to happen for Safari sometimes
 *
 * @param request The request object. Playwright provides size on the request, not the response
 * @param size The minimum size in bytes
 */
async function expectMinimumResponseSize(
  request: Request | undefined,
  size: number
) {
  if (!request) {
    throw new Error('Request is undefined');
  }

  const responseSize = (await request.sizes()).responseBodySize;

  // Safari doesn't seem to provide response size for some requests
  if (responseSize > 0) {
    expect(responseSize).toBeGreaterThan(size);
  }
}

function recordRequests(page: Page): Request[] {
  const requests: Request[] = [];
  page.on('request', req => requests.push(req));
  return requests;
}

test('lazy loads plotly', async ({ page }) => {
  const requests = recordRequests(page);

  await page.goto('');
  await page.waitForLoadState('networkidle');

  expect(
    await findChunkContaining(requests, LIBRARY_MARKERS.plotly)
  ).toBeUndefined();

  await openPlot(page, 'simple_plot');

  const plotlyRequest = await findChunkContaining(
    requests,
    LIBRARY_MARKERS.plotly
  );
  expect(plotlyRequest).toBeDefined();
  await expectMinimumResponseSize(plotlyRequest, 300 * 1000); // 300kB
});

test('lazy loads mathjax', async ({ page }) => {
  const requests = recordRequests(page);

  await page.goto('');
  await page.waitForLoadState('networkidle');

  expect(
    await findChunkContaining(requests, LIBRARY_MARKERS.mathjax)
  ).toBeUndefined();

  const controlsButton = page.getByText('Controls');
  await controlsButton.click();
  const markdownButton = page.getByText('Markdown Widget');
  await markdownButton.click();

  await expect(page.locator('.markdown-panel')).toBeVisible({
    timeout: 30_000, // Webkit takes a while for this sometimes
  });
  await expect(page.locator('.markdown-panel .loading-spinner')).toHaveCount(0);

  const mathjaxRequest = await findChunkContaining(
    requests,
    LIBRARY_MARKERS.mathjax
  );
  expect(mathjaxRequest).toBeDefined();
  await expectMinimumResponseSize(mathjaxRequest, 500 * 1000); // 500kB
});

test('loads monaco in its own chunk', async ({ page }) => {
  const requests = recordRequests(page);

  // The console is open on load, so Monaco is requested right away.
  // It must come from its own chunk rather than the entry
  await page.goto('');
  await expect(page.locator('.console-input .monaco-editor')).toBeVisible();
  await page.waitForLoadState('networkidle');

  const entryUrl = await page.evaluate(
    () =>
      document.querySelector<HTMLScriptElement>('script[type="module"][src]')
        ?.src
  );
  expect(entryUrl).toBeDefined();

  const monacoRequest = await findChunkContaining(
    requests,
    LIBRARY_MARKERS.monaco
  );
  expect(monacoRequest).toBeDefined();
  expect(monacoRequest?.url()).not.toBe(entryUrl);
  await expectMinimumResponseSize(monacoRequest, 500 * 1000); // 500kB compressed
});

test('defers loading monaco until an editor is used', async ({ page }) => {
  const requests = recordRequests(page);

  // The embed widget page has no editors until a table option opens one
  await page.goto('http://localhost:4010?name=all_types');
  await expect(page.locator('.iris-grid canvas').first()).toBeVisible();
  await page.waitForLoadState('networkidle');

  expect(
    await findChunkContaining(requests, LIBRARY_MARKERS.monaco)
  ).toBeUndefined();

  await page.locator('data-testid=btn-iris-grid-settings-button-table').click();
  await page.getByText('Custom Columns').click();
  await expect(
    page.locator('.input-editor-wrapper .monaco-editor').first()
  ).toBeVisible();

  const monacoRequest = await findChunkContaining(
    requests,
    LIBRARY_MARKERS.monaco
  );
  expect(monacoRequest).toBeDefined();
});
