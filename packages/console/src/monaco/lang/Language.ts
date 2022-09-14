import * as monaco from 'monaco-editor';

export type Language = {
  id: string;
  conf: monaco.languages.LanguageConfiguration;
  language:
    | monaco.languages.IMonarchLanguage
    | monaco.Thenable<monaco.languages.IMonarchLanguage>;
};
