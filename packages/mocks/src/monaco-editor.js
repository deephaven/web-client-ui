/**
 * Mock needed because for some reason jest gets and unable to resolve import with monaco.
 * If the issue gets resolved, this mock shouldn't be needed:
 * https://github.com/facebook/create-react-app/issues/5881
 */
import { createMonacoBaseAPI } from '../../../node_modules/monaco-editor/esm/vs/editor/common/services/editorBaseApi.js';

const monaco = createMonacoBaseAPI();

monaco.languages = {
  registerCompletionItemProvider: () => {},
};

module.exports = monaco;
