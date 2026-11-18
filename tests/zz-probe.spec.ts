import { test } from '@playwright/test';

test('probe loading gaps', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __gaps: string[]; __seen: boolean };
    w.__gaps = [];
    w.__seen = false;
    const check = () => {
      const root = document.getElementById('root');
      if (root == null) return;
      const spinner = root.querySelector('[role="progressbar"][aria-label="Loading..."]');
      const loaded = root.querySelector('[data-testid="app-loaded"]');
      if (spinner || loaded) { w.__seen = true; }
      if (loaded) return;
      if (!spinner) {
        w.__gaps.push(`${performance.now().toFixed(1)} seen=${w.__seen} ${root.innerHTML.slice(0, 300)}`);
      }
    };
    new MutationObserver(check).observe(document, { subtree: true, childList: true, attributes: true });
  });
  await page.goto('');
  await page.getByTestId('app-loaded').waitFor();
  const gaps = await page.evaluate(() => (window as unknown as { __gaps: string[] }).__gaps);
  console.log('GAPS', JSON.stringify(gaps, null, 1));
});
