import { ESLint } from 'eslint';

/**
 * Run eslint against js/jsx files and ensures it passes linting, printing out any errors.
 */
it('eslint', async () => {
  const eslint = new ESLint({
    extensions: ['js', 'jsx', 'ts', 'tsx'],
    cache: true,
    cacheStrategy: 'content',
  });
  const results = await eslint.lintFiles(
    './packages/*/src/**/*.{js,jsx,ts,tsx}'
  );
  const formatter = await eslint.loadFormatter();
  const resultText = formatter.format(results);
  expect(resultText).toBeFalsy();
}, 60000); // increase lint timeout for jenkins
