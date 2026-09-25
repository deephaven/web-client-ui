import React from 'react';
import * as monaco from 'monaco-editor';
import { render, waitFor } from '@testing-library/react';
import Editor from './Editor';
import MonacoUtils from '../monaco/MonacoUtils';

// Monaco loads on demand, which takes longer than a test's default timeout
beforeAll(async () => {
  await MonacoUtils.load();
}, 30000);

it('creates editors once Monaco has loaded, sharing one link provider, and destroys them on unmount', async () => {
  const registerLinkProvider = jest.spyOn(
    monaco.languages,
    'registerLinkProvider'
  );
  const onEditorInitialized = jest.fn();
  const onEditorWillDestroy = jest.fn();
  const { unmount } = render(
    <>
      <Editor
        onEditorInitialized={onEditorInitialized}
        onEditorWillDestroy={onEditorWillDestroy}
      />
      <Editor
        onEditorInitialized={onEditorInitialized}
        onEditorWillDestroy={onEditorWillDestroy}
      />
    </>
  );
  await waitFor(() => expect(onEditorInitialized).toHaveBeenCalledTimes(2));

  expect(registerLinkProvider).toHaveBeenCalledTimes(1);
  expect(registerLinkProvider).toHaveBeenCalledWith('plaintext', {
    provideLinks: MonacoUtils.provideLinks,
  });

  unmount();
  const editors = onEditorInitialized.mock.calls.map(([editor]) => editor);
  expect(onEditorWillDestroy).toHaveBeenCalledTimes(2);
  editors.forEach(editor => {
    expect(onEditorWillDestroy).toHaveBeenCalledWith(editor);
  });
});
