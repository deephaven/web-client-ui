/**
 * Mock needed because for some reason jest gets and unable to resolve import with monaco.
 * If the issue gets resolved, this mock shouldn't be needed:
 * https://github.com/facebook/create-react-app/issues/5881
 */
const editor = {
  create: () => ({
    addCommand: () => {},
    focus: () => {},
    layout: () => {},
    dispose: () => {},
    getModel: () => ({
      getLineCount: () => 0,
      getModeId: () => 'modeId',
      getValue: () => '',
    }),
    onDidChangeModelContent: () => () => {},
    onKeyDown: () => {},
  }),
};

const languages = {
  registerCompletionItemProvider: () => {},
};

const KeyMod = {
  CtrlCmd: 'C',
};

const KeyCode = {
  KEY_F: 'F',
};

const monaco = {
  editor,
  languages,
  KeyMod,
  KeyCode,
};

module.exports = monaco;
