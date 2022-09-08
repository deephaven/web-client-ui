/**
 * Mock needed because for some reason jest gets and unable to resolve import with monaco.
 * If the issue gets resolved, this mock shouldn't be needed:
 * https://github.com/facebook/create-react-app/issues/5881
 */
import { createMonacoBaseAPI } from '../../../node_modules/monaco-editor/esm/vs/editor/common/services/editorBaseApi.js';
import { createMonacoEditorAPI } from '../../../node_modules/monaco-editor/esm/vs/editor/standalone/browser/standaloneEditor.js';
import { createMonacoLanguagesAPI } from '../../../node_modules/monaco-editor/esm/vs/editor/standalone/browser/standaloneLanguages.js';

const monaco = createMonacoBaseAPI();
monaco.editor = createMonacoEditorAPI();
monaco.languages = createMonacoLanguagesAPI();

module.exports = monaco;
