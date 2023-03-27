import React from 'react';
import { render } from '@testing-library/react';
import * as monaco from 'monaco-editor';
import dh from '@deephaven/jsapi-shim';
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

it('provides completion items properly', async () => {
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
