import stylelint from 'stylelint';

/**
 * Runs stylelint against our SCSS files to ensure it passes linting tests, printing out any errors.
 */
it('stylelint', async () => {
  const lintResults = await stylelint.lint({
    files: './src/**/*.scss',
    cache: true,
  });

  const formatResult = (result: stylelint.LintResult): string => {
    const { warnings, source } = result;
    const warningMessages = warnings.map(
      ({ line, column, text }) => `${line}:${column}\t${text}`
    );
    return `${source}\n${warningMessages.join('\n')}`;
  };

  const failureMessage = lintResults.results
    .filter(result => result.errored)
    .map(formatResult)
    .join('\n');

  expect(failureMessage).toBeFalsy();
}, 60000); // increase lint timeout for jenkins
