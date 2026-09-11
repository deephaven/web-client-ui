import * as monaco from 'monaco-editor';
import initRuff, { Workspace } from '@astral-sh/ruff-wasm-web';
import MonacoUtils from './MonacoUtils';
import MonacoProviders from './MonacoProviders';

it('runs setup and Ruff once Monaco loads, without loading it', async () => {
  (Workspace as unknown as { version: () => string }).version = () => 'test';
  const registerLanguage = jest.spyOn(monaco.languages, 'register');
  jest.spyOn(monaco.editor, 'defineTheme').mockImplementation(() => undefined);
  jest.spyOn(monaco.editor, 'setTheme').mockImplementation(() => undefined);
  const callback = jest.fn();

  // Before loading, setup is queued
  MonacoUtils.whenLoaded(callback);
  MonacoUtils.init();
  MonacoProviders.setRuffSettings({});
  await new Promise(resolve => {
    setTimeout(resolve, 0);
  });
  expect(callback).not.toHaveBeenCalled();
  expect(registerLanguage).not.toHaveBeenCalled();
  expect(initRuff).not.toHaveBeenCalled();
  expect(() => MonacoUtils.getMonaco()).toThrow();

  const loaded = await MonacoUtils.load();
  expect(loaded.editor).toBe(monaco.editor);
  expect(MonacoUtils.getMonaco()).toBe(loaded);
  expect(callback).toHaveBeenCalledTimes(1);
  expect(registerLanguage).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'deephavenDb' })
  );
  await MonacoProviders.initRuff();
  expect(initRuff).toHaveBeenCalledTimes(1);

  // A lint still pending when its model is disposed is cancelled
  jest.useFakeTimers();
  const lintPython = jest
    .spyOn(MonacoProviders, 'lintPython')
    .mockImplementation(() => undefined);
  const model = loaded.editor.createModel('x = 1', 'python');
  lintPython.mockClear();
  // Two quick edits: the first lints immediately, the second leaves a lint pending
  model.setValue('x = 2');
  model.setValue('x = 3');
  expect(lintPython).toHaveBeenCalledTimes(1);
  model.dispose();
  jest.advanceTimersByTime(1000);
  expect(lintPython).toHaveBeenCalledTimes(1);
  jest.useRealTimers();

  // Once loaded, the same Monaco is reused and callbacks run immediately
  expect(await MonacoUtils.load()).toBe(loaded);
  const laterCallback = jest.fn();
  MonacoUtils.whenLoaded(laterCallback);
  expect(laterCallback).toHaveBeenCalledTimes(1);
});
