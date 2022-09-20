import React from 'react';
import {
  findAllByRole,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileStorageItem } from '@deephaven/file-explorer';
import { Container } from '@deephaven/golden-layout';
import { FileExplorerPanel, FileExplorerPanelProps } from './FileExplorerPanel';
import MockFileStorage from './MockFileStorage';

function makeFileName(index = 0): string {
  return `testfile${index}`;
}

function makeDirName(index = 0): string {
  return `testdir${index}`;
}

function makeFile(basename: string, path = '/'): FileStorageItem {
  const filename = `${path}${basename}`;
  return {
    basename,
    filename,
    type: 'file',
    id: filename,
  };
}

function makeFiles(count = 5) {
  const result: FileStorageItem[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(makeFile(makeFileName(i)));
  }
  return result;
}

function makeDirectory(name: string, path = '/'): FileStorageItem {
  const file = makeFile(name, path);
  file.type = 'directory';
  return file;
}

function makeDirectories(count = 5) {
  const result: FileStorageItem[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(makeDirectory(`testdir${i}`));
  }
  return result;
}

const eventHub = {
  emit: () => undefined,
  on: () => undefined,
  off: () => undefined,
  trigger: () => undefined,
  unbind: () => undefined,
};
const container: Partial<Container> = {
  emit: () => undefined,
  on: () => undefined,
  off: () => undefined,
};

function makeContainer({ fileStorage }: Partial<FileExplorerPanelProps> = {}) {
  return render(
    <FileExplorerPanel
      glContainer={container}
      glEventHub={eventHub}
      localDashboardId="TEST DASHBOARD"
      fileStorage={fileStorage}
      language="TEST LANGUAGE"
      dispatch={undefined}
    />
  );
}

it('mounts properly and shows file list', async () => {
  const files = makeFiles();

  const fileStorage = new MockFileStorage(files);

  makeContainer({ fileStorage });

  const foundItems = await screen.findAllByRole('listitem');
  expect(foundItems).toHaveLength(files.length);
});

describe('selects directory for NewItemModal correctly', () => {
  function clickItem(itemIndex: number, options = {}): void {
    userEvent.click(screen.getAllByRole('listitem')[itemIndex], options);
  }

  function getNewItemModal(): HTMLElement {
    userEvent.click(screen.getByRole('button', { name: 'New folder' }));
    return screen.getByRole('dialog');
  }

  const dirs = makeDirectories();
  const files = makeFiles();
  const items = dirs.concat(files);

  beforeEach(async () => {
    const fileStorage = new MockFileStorage(dirs.concat(files));
    makeContainer({ fileStorage });
    const foundItems = await screen.findAllByRole('listitem');
    expect(foundItems).toHaveLength(items.length);
  });

  it('selects directory correctly', async () => {
    clickItem(0);
    const modal = getNewItemModal();

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);

    expect(buttonContent).toContain('root');
    expect(buttonContent).toContain('testdir0');
    for (let i = 1; i < dirs.length; i += 1) {
      expect(buttonContent).not.toContain(makeDirName(i));
    }
  });

  it('selects root directory when multiple directories are selected', async () => {
    clickItem(0);
    clickItem(3, { ctrlKey: true });
    const modal = getNewItemModal();

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);

    expect(buttonContent).toContain('root');
    for (let i = 0; i < dirs.length; i += 1) {
      expect(buttonContent).not.toContain(makeDirName(i));
    }
  });

  it('selects root directory when no directories are selected', async () => {
    const modal = getNewItemModal();

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);

    expect(buttonContent).toContain('root');
    for (let i = 0; i < dirs.length; i += 1) {
      expect(buttonContent).not.toContain(makeDirName(i));
    }
  });

  it('selects directory correctly through arrow keys', async () => {
    const item = screen.getAllByRole('listitem')[1];
    userEvent.click(item);
    fireEvent.keyDown(item, { key: 'ArrowDown' });
    fireEvent.keyDown(item, { key: 'ArrowDown' });
    fireEvent.keyDown(item, { key: 'ArrowUp' });

    const modal = getNewItemModal();

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);

    expect(buttonContent).toContain('root');
    expect(buttonContent).toContain('testdir2');
    for (let i = 0; i < dirs.length; i += 1) {
      if (i !== 2) {
        expect(buttonContent).not.toContain(makeDirName(i));
      }
    }
  });

  it('does not set the path if a file (not directory) is selected', async () => {
    const item = screen.getAllByRole('listitem')[dirs.length + 1];
    userEvent.click(item);

    const modal = getNewItemModal();

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);

    expect(buttonContent).toContain('root');
    for (let i = 0; i < dirs.length; i += 1) {
      expect(buttonContent).not.toContain(makeDirName(i));
    }
    for (let i = 0; i < files.length; i += 1) {
      expect(buttonContent).not.toContain(makeFileName(i));
    }
  });
});
