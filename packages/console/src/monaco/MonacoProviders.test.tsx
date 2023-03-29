import React from 'react';
import { render } from '@testing-library/react';
import * as monaco from 'monaco-editor';
import dh, { DocumentRange, Position } from '@deephaven/jsapi-shim';
import MonacoProviders from './MonacoProviders';

const DEFAULT_LANGUAGE = 'test';

function makeProviders(
  language = DEFAULT_LANGUAGE,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session = new (dh as any).IdeSession(language),
  model = { uri: {}, getVersionId: () => 1 }
) {
  const wrapper = render(
    <MonacoProviders
      model={model as monaco.editor.ITextModel}
      session={session}
      language={language}
    />
  );

  return wrapper;
}

it('renders without crashing', () => {
  const disposable = { dispose: jest.fn() };
  monaco.languages.registerCompletionItemProvider = jest.fn(() => disposable);
  makeProviders();
});

it('registers/deregisters completion provider properly', () => {
  const disposable = { dispose: jest.fn() };

  monaco.languages.registerCompletionItemProvider = jest.fn(() => disposable);

  const wrapper = makeProviders();

  expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
    DEFAULT_LANGUAGE,
    expect.objectContaining({ provideCompletionItems: expect.anything() })
  );
  expect(disposable.dispose).not.toHaveBeenCalled();

  wrapper.unmount();

  expect(disposable.dispose).toHaveBeenCalledTimes(1);
});

// Enterprise provides no documentation. Community provides MarkupContent
it('provides completion items with no documentation object', async () => {
  const disposable = { dispose: jest.fn() };
  const newText = 'test';
  const myRegister = jest.fn(() => disposable);
  monaco.languages.registerCompletionItemProvider = myRegister;
  const items = [
    {
      label: newText,
      kind: 0,
      textEdit: {
        range: {
          start: { line: 5, character: 30 },
          end: { line: 10, character: 60 },
        },
        text: newText,
      },
    },
  ];
  const promiseItems = Promise.resolve(items);
  const language = DEFAULT_LANGUAGE;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession(language);
  session.getCompletionItems = jest.fn(() => promiseItems);

  const model = { uri: { path: 'test' }, getVersionId: jest.fn(() => 1) };
  makeProviders(language, session, model);
  const position = { lineNumber: 1, column: 1 };
  expect(myRegister).toHaveBeenCalledTimes(1);
  expect.assertions(4);

  const calls: {
    provideCompletionItems: (
      model: unknown,
      position: unknown
    ) => Promise<{ suggestions: unknown[] }>;
  }[] = myRegister.mock.calls[0];
  const fn = calls[1];

  const resultItems = await fn.provideCompletionItems(model, position);
  expect(session.getCompletionItems).toHaveBeenCalled();
  const { suggestions } = resultItems;
  expect(suggestions.length).toBe(items.length);
  expect(suggestions[0]).toMatchObject({
    insertText: newText,
    label: newText,
    documentation: undefined,
  });
});

it('provides completion items properly with documentation object', async () => {
  const disposable = { dispose: jest.fn() };
  const newText = 'test';
  const myRegister = jest.fn(() => disposable);
  monaco.languages.registerCompletionItemProvider = myRegister;
  const items = [
    {
      label: newText,
      kind: 0,
      textEdit: {
        range: {
          start: { line: 5, character: 30 },
          end: { line: 10, character: 60 },
        },
        text: newText,
      },
      documentation: {
        value: 'markdown',
        kind: 'markdown',
      },
    },
    {
      label: `${newText}2`,
      kind: 0,
      textEdit: {
        range: {
          start: { line: 5, character: 30 },
          end: { line: 10, character: 60 },
        },
        text: `${newText}2`,
      },
      documentation: {
        value: 'plaintext',
        kind: 'plaintext',
      },
    },
  ];
  const promiseItems = Promise.resolve(items);
  const language = DEFAULT_LANGUAGE;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession(language);
  session.getCompletionItems = jest.fn(() => promiseItems);

  const model = { uri: { path: 'test' }, getVersionId: jest.fn(() => 1) };
  makeProviders(language, session, model);
  const position = { lineNumber: 1, column: 1 };
  expect(myRegister).toHaveBeenCalledTimes(1);
  expect.assertions(5);

  const calls: {
    provideCompletionItems: (
      model: unknown,
      position: unknown
    ) => Promise<{ suggestions: unknown[] }>;
  }[] = myRegister.mock.calls[0];
  const fn = calls[1];

  const resultItems = await fn.provideCompletionItems(model, position);
  expect(session.getCompletionItems).toHaveBeenCalled();
  const { suggestions } = resultItems;
  expect(suggestions.length).toBe(items.length);
  expect(suggestions[0]).toMatchObject({
    insertText: newText,
    label: newText,
    documentation: {
      value: 'markdown',
    },
  });
  expect(suggestions[1]).toMatchObject({
    insertText: `${newText}2`,
    label: `${newText}2`,
    documentation: 'plaintext',
  });
});

it('registers/deregisters signature help provider properly', () => {
  const disposable = { dispose: jest.fn() };

  monaco.languages.registerSignatureHelpProvider = jest.fn(() => disposable);

  const wrapper = makeProviders();

  expect(monaco.languages.registerSignatureHelpProvider).toHaveBeenCalledWith(
    DEFAULT_LANGUAGE,
    expect.objectContaining({ provideSignatureHelp: expect.anything() })
  );
  expect(disposable.dispose).not.toHaveBeenCalled();

  wrapper.unmount();

  expect(disposable.dispose).toHaveBeenCalledTimes(1);
});

it('does not register signature help if it is not available', () => {
  const disposable = { dispose: jest.fn() };

  monaco.languages.registerSignatureHelpProvider = jest.fn(() => disposable);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession(DEFAULT_LANGUAGE);
  session.getSignatureHelp = undefined;

  const wrapper = makeProviders(DEFAULT_LANGUAGE, session);

  expect(monaco.languages.registerSignatureHelpProvider).not.toHaveBeenCalled();

  wrapper.unmount();

  expect(disposable.dispose).not.toHaveBeenCalled();
});

it('provides signature help properly', async () => {
  const disposable = { dispose: jest.fn() };
  const newText = 'test';
  const myRegister = jest.fn(() => disposable);
  monaco.languages.registerSignatureHelpProvider = myRegister;
  const items = [
    {
      label: newText,
      documentation: { kind: 'plaintext', value: newText },
      parameters: [
        {
          label: 'param',
          documentation: { kind: 'plaintext', value: 'paramdoc' },
        },
      ],
      activeParameter: 0,
    },
  ];
  const promiseItems = Promise.resolve(items);
  const language = DEFAULT_LANGUAGE;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession(language);
  session.getSignatureHelp = jest.fn(() => promiseItems);

  const model = { uri: { path: 'test' }, getVersionId: jest.fn(() => 1) };
  makeProviders(language, session, model);
  const position = { lineNumber: 1, column: 1 };
  expect.assertions(6);
  expect(myRegister).toHaveBeenCalledTimes(1);

  const calls: {
    provideSignatureHelp: (
      model: unknown,
      position: unknown
    ) => Promise<{
      value: {
        signatures: unknown[];
        activeSignature: number;
        activeParameter: number;
      };
    }>;
  }[] = myRegister.mock.calls[0];
  const fn = calls[1];

  const resultItems = await fn.provideSignatureHelp(model, position);
  expect(session.getSignatureHelp).toHaveBeenCalled();
  const { value } = resultItems;
  const { signatures, activeSignature, activeParameter } = value;
  expect(signatures.length).toBe(items.length);
  expect(signatures[0]).toMatchObject({
    documentation: newText,
    label: newText,
    parameters: items[0].parameters,
  });
  expect(activeSignature).toBe(0);
  expect(activeParameter).toBe(0);
});

it('registers/deregisters hover provider properly', () => {
  const disposable = { dispose: jest.fn() };

  monaco.languages.registerHoverProvider = jest.fn(() => disposable);

  const wrapper = makeProviders();

  expect(monaco.languages.registerHoverProvider).toHaveBeenCalledWith(
    DEFAULT_LANGUAGE,
    expect.objectContaining({ provideHover: expect.anything() })
  );
  expect(disposable.dispose).not.toHaveBeenCalled();

  wrapper.unmount();

  expect(disposable.dispose).toHaveBeenCalledTimes(1);
});

it('does not register hover if it is not available', () => {
  const disposable = { dispose: jest.fn() };

  monaco.languages.registerHoverProvider = jest.fn(() => disposable);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession(DEFAULT_LANGUAGE);
  session.getHover = undefined;

  const wrapper = makeProviders(DEFAULT_LANGUAGE, session);

  expect(monaco.languages.registerHoverProvider).not.toHaveBeenCalled();

  wrapper.unmount();

  expect(disposable.dispose).not.toHaveBeenCalled();
});

it('provides hover info properly', async () => {
  const disposable = { dispose: jest.fn() };
  const newText = 'test';
  const myRegister = jest.fn(() => disposable);
  monaco.languages.registerHoverProvider = myRegister;
  const items = {
    contents: {
      value: newText,
    },
  };
  const promiseItems = Promise.resolve(items);
  const language = DEFAULT_LANGUAGE;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = new (dh as any).IdeSession(language);
  session.getHover = jest.fn(() => promiseItems);

  const model = { uri: { path: 'test' }, getVersionId: jest.fn(() => 1) };
  makeProviders(language, session, model);
  const position = { lineNumber: 1, column: 1 };
  expect(myRegister).toHaveBeenCalledTimes(1);
  expect.assertions(3);

  const calls: {
    provideHover: (
      model: unknown,
      position: unknown
    ) => Promise<{
      contents: {
        value: string;
      }[];
    }>;
  }[] = myRegister.mock.calls[0];
  const fn = calls[1];

  const { contents } = await fn.provideHover(model, position);
  expect(session.getHover).toHaveBeenCalled();
  expect(contents[0]).toMatchObject({
    value: newText,
  });
});

it('converts lsp to monaco range', () => {
  const lspRange: DocumentRange = {
    start: { line: 0, character: 0 },
    end: { line: 1, character: 1 },
  };

  const expectedMonacoRange: monaco.IRange = {
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: 2,
    endColumn: 2,
  };

  const monacoRange = MonacoProviders.lspToMonacoRange(lspRange);
  expect(monacoRange).toMatchObject(expectedMonacoRange);
});

it('converts monaco to lsp position', () => {
  const monacoPosition: monaco.IPosition = {
    lineNumber: 1,
    column: 1,
  };

  const expectedLspPosition: Position = {
    line: 0,
    character: 0,
  };

  const lspPosition = MonacoProviders.monacoToLspPosition(monacoPosition);
  expect(lspPosition).toMatchObject(expectedLspPosition);
});
