module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'selector-pseudo-class-no-unknown': [
      true,
      {
        // CSS modules: `:export` blocks and `:global()` selectors
        ignorePseudoClasses: ['export', 'global'],
      },
    ],
    // TODO #447: Re-enable these rules
    'color-function-notation': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'keyframes-name-pattern': null,
    'property-no-vendor-prefix': null,
    'rule-empty-line-before': null,
    'selector-class-pattern': null,
    'selector-no-vendor-prefix': null,
    'shorthand-property-no-redundant-values': null,
    'comment-empty-line-before': null,
    // Rewriting `:not(.a):not(.b)` as `:not(.a, .b)` lowers its specificity
    'selector-not-notation': null,
    // Match the existing `@import './file.css';` style
    'import-notation': 'string',
    // Bootstrap derived input padding values, e.g. 0.42145rem
    'number-max-precision': 5,
    // Custom properties are defined by the theme or a parent component
    'custom-property-pattern': null,
    // `:export` blocks in CSS modules contain properties that are read by JS
    'property-no-unknown': [true, { ignoreSelectors: [':export'] }],
  },
};
