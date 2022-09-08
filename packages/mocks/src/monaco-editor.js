/**
 * Mock needed because for some reason jest gets and unable to resolve import with monaco.
 * If the issue gets resolved, this mock shouldn't be needed:
 * https://github.com/facebook/create-react-app/issues/5881
 */
const editor = {
  create: () => ({
    addAction: () => {},
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
  CtrlCmd: 2048,
  Shift: 1024,
  Alt: 512,
  WinCtrl: 256,
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
