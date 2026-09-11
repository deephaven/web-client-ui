import React from 'react';
import { render, waitFor } from '@testing-library/react';
import Editor from './Editor';

it('creates the editor once Monaco has loaded and destroys it on unmount', async () => {
  const onEditorInitialized = jest.fn();
  const onEditorWillDestroy = jest.fn();
  const { unmount } = render(
    <Editor
      onEditorInitialized={onEditorInitialized}
      onEditorWillDestroy={onEditorWillDestroy}
    />
  );
  await waitFor(() => expect(onEditorInitialized).toHaveBeenCalledTimes(1));

  unmount();
  const [editor] = onEditorInitialized.mock.calls[0];
  expect(onEditorWillDestroy).toHaveBeenCalledWith(editor);
});
