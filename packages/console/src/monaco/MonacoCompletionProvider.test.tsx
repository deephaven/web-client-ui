import React from 'react';
import { render } from '@testing-library/react';
import * as monaco from 'monaco-editor';
import dh from '@deephaven/jsapi-shim';
import MonacoCompletionProvider from './MonacoCompletionProvider';

const DEFAULT_LANGUAGE = 'test';

function makeCompletionProvider(
  language = DEFAULT_LANGUAGE,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session = new (dh as any).IdeSession(language),
  model = { uri: {} }
) {
  const wrapper = render(
    <MonacoCompletionProvider
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
  makeCompletionProvider();
});

it('registers/deregisters completion provider properly', () => {
  const disposable = { dispose: jest.fn() };

  monaco.languages.registerCompletionItemProvider = jest.fn(() => disposable);

  const wrapper = makeCompletionProvider();

  expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
    DEFAULT_LANGUAGE,
    expect.objectContaining({ provideCompletionItems: expect.anything() })
  );
  expect(disposable.dispose).not.toHaveBeenCalled();

  wrapper.unmount();

  expect(disposable.dispose).toHaveBeenCalledTimes(1);
});

it('provides completion items properly', () => {
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

  const model = { uri: { path: 'test' } };
  makeCompletionProvider(language, session, model);
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

  return fn.provideCompletionItems(model, position).then(resultItems => {
    expect(session.getCompletionItems).toHaveBeenCalled();

    const { suggestions } = resultItems;
    expect(suggestions.length).toBe(items.length);
    expect(suggestions[0]).toMatchObject({
      insertText: newText,
      label: newText,
    });
  });
});
