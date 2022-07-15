import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';

export type Language = {
  id: string;
  conf: monaco.languages.LanguageConfiguration;
  language:
    | monaco.languages.IMonarchLanguage
    | monaco.Thenable<monaco.languages.IMonarchLanguage>;
};
