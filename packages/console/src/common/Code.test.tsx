import React from 'react';
import * as monaco from 'monaco-editor';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeContext, type ThemeContextValue } from '@deephaven/components';
import Code from './Code';
import MonacoUtils from '../monaco/MonacoUtils';

// Monaco loads on demand, which takes longer than a test's default timeout
beforeAll(async () => {
  await MonacoUtils.load();
}, 30000);

const themeContextValue: ThemeContextValue = {
  activeThemes: [],
  selectedThemeKey: 'default-dark',
  themes: [],
  setSelectedThemeKey: jest.fn(),
};

function renderCode(code: string) {
  return render(
    <ThemeContext.Provider value={themeContextValue}>
      <Code language="plaintext">{code}</Code>
    </ThemeContext.Provider>
  );
}

it('renders the colorized code once Monaco has loaded', async () => {
  jest
    .spyOn(monaco.editor, 'colorize')
    .mockResolvedValueOnce('<span class="colorized">x = 1</span>');
  const { container } = renderCode('x = 1');

  await waitFor(() =>
    expect(container.querySelector('.colorized')).toHaveTextContent('x = 1')
  );
});

it('shows the code as plain text when Monaco fails to load', async () => {
  jest
    .spyOn(MonacoUtils, 'load')
    .mockRejectedValueOnce(new Error('Chunk failed'));
  renderCode('x = 1');

  const code = await screen.findByText('x = 1');
  expect(code).toHaveStyle({ whiteSpace: 'pre-wrap' });
});
