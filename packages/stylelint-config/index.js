module.exports = {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-prettier-scss'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['function', 'if', 'each', 'include', 'mixin'],
      },
    ],
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['export'],
      },
    ],
    // TODO #447: Re-enable these rules
    'color-function-notation': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'keyframes-name-pattern': null,
    'property-no-vendor-prefix': null,
    'rule-empty-line-before': null,
    'scss/at-import-partial-extension': null,
    'scss/double-slash-comment-empty-line-before': null,
    'scss/double-slash-comment-whitespace-inside': null,
    'scss/dollar-variable-empty-line-before': null,
    'scss/no-global-function-names': null,
    'selector-class-pattern': null,
    'selector-no-vendor-prefix': null,
    'shorthand-property-no-redundant-values': null,
  },
};
