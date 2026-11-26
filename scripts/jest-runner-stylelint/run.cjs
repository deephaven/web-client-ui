// jest-runner-stylelint reports `output`, which stylelint 17 no longer
// returns, so its failures had no message.
const { pass, fail } = require('create-jest-runner');
const stylelint = require('stylelint');

module.exports = async ({ testPath }) => {
  const start = Date.now();
  const { errored, report } = await stylelint.lint({
    files: testPath,
    formatter: 'string',
  });
  const end = Date.now();

  if (errored) {
    return fail({ start, end, test: { path: testPath, errorMessage: report } });
  }
  return pass({ start, end, test: { path: testPath } });
};
