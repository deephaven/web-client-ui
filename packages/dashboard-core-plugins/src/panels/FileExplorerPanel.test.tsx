import React from 'react';
import {
  findAllByRole,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DirectoryStorageItem,
  FileStorageItem,
} from '@deephaven/file-explorer';
import type { Container } from '@deephaven/golden-layout';
import { TestUtils } from '@deephaven/utils';
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

function makeDirectory(basename: string, path = '/'): DirectoryStorageItem {
  const filename = `${path}${basename}`;
  return {
    basename,
    filename,
    type: 'directory',
    id: filename,
    isExpanded: false,
  };
}

function makeDirectories(count = 5) {
  const result: DirectoryStorageItem[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(makeDirectory(`testdir${i}`));
  }
  return result;
}

function makeNested(directories: number[], fileNum: number): FileStorageItem {
  const basename = `/${directories
    .map(directory => makeDirName(directory))
    .join('/')}/`;
  return makeFile(makeFileName(fileNum), basename);
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

describe('selects and expands directory for NewItemModal correctly', () => {
  async function clickItem(
    itemIndex: number,
    options = { ctrlKey: false }
  ): Promise<void> {
    const element = screen.getAllByRole('listitem')[itemIndex];
    if (options.ctrlKey) {
      await TestUtils.controlClick(user, element);
    } else {
      await user.click(element);
    }
  }

  async function getNewItemModal(): Promise<HTMLElement> {
    await user.click(screen.getByRole('button', { name: 'New folder' }));
    return screen.getByRole('dialog');
  }

  let user: ReturnType<typeof userEvent.setup>;
  let dirs: DirectoryStorageItem[] = [];
  let files: FileStorageItem[] = [];
  let items: FileStorageItem[] = [];

  beforeEach(async () => {
    user = userEvent.setup();
    dirs = makeDirectories();
    files = makeFiles();
    files.push(makeNested([2], 2));
    files.push(makeNested([0, 3], 4));
    items = dirs.concat(files);

    const fileStorage = new MockFileStorage(items);
    makeContainer({ fileStorage });
    const foundItems = await screen.findAllByRole('listitem');
    expect(foundItems).toHaveLength(items.length);
  });

  it('selects and expands directory correctly', async () => {
    await clickItem(0);
    const modal = await getNewItemModal();

    const itemsInModal = await within(modal).findAllByRole('listitem');
    expect(itemsInModal).toHaveLength(items.length);

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);
    const homeButton = await findAllByRole(modal, 'button', { name: 'Home' });

    expect(homeButton).toHaveLength(1);
    expect(buttonContent).toContain('testdir0');
    expect(dirs[0].isExpanded).toBe(true);
    for (let i = 1; i < dirs.length; i += 1) {
      expect(buttonContent).not.toContain(makeDirName(i));
      expect(dirs[i].isExpanded).toBe(false);
    }
  });

  it('selects root directory when multiple directories are selected', async () => {
    await clickItem(0);
    await clickItem(3, { ctrlKey: true });
    const modal = await getNewItemModal();

    const itemsInModal = await within(modal).findAllByRole('listitem');
    expect(itemsInModal).toHaveLength(items.length);

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);
    const homeButton = await findAllByRole(modal, 'button', { name: 'Home' });

    expect(homeButton).toHaveLength(1);
    for (let i = 0; i < dirs.length; i += 1) {
      expect(buttonContent).not.toContain(makeDirName(i));
      expect(dirs[i].isExpanded).toBe(false);
    }
  });

  it('selects root directory when no directories are selected', async () => {
    const modal = await getNewItemModal();

    const itemsInModal = await within(modal).findAllByRole('listitem');
    expect(itemsInModal).toHaveLength(items.length);

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);
    const homeButton = await findAllByRole(modal, 'button', { name: 'Home' });

    expect(homeButton).toHaveLength(1);
    for (let i = 0; i < dirs.length; i += 1) {
      expect(buttonContent).not.toContain(makeDirName(i));
      expect(dirs[i].isExpanded).toBe(false);
    }
  });

  it('selects and expands directory correctly through arrow keys', async () => {
    const item = screen.getAllByRole('listitem')[1];
    await user.click(item);
    fireEvent.keyDown(item, { key: 'ArrowDown' });
    fireEvent.keyDown(item, { key: 'ArrowDown' });
    fireEvent.keyDown(item, { key: 'ArrowUp' });

    const modal = await getNewItemModal();

    const itemsInModal = await within(modal).findAllByRole('listitem');
    expect(itemsInModal).toHaveLength(items.length);

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);
    const homeButton = await findAllByRole(modal, 'button', { name: 'Home' });

    expect(homeButton).toHaveLength(1);
    expect(buttonContent).toContain('testdir2');
    expect(dirs[2].isExpanded).toBe(true);

    for (let i = 0; i < dirs.length; i += 1) {
      if (i !== 2) {
        expect(buttonContent).not.toContain(makeDirName(i));
        expect(dirs[i].isExpanded).toBe(false);
      }
    }
  });

  it('sets and expands the path correctly if a non-directory file within a directory is selected', async () => {
    const item = screen.getAllByRole('listitem')[items.length - 2];
    await user.click(item);

    const modal = await getNewItemModal();

    const itemsInModal = await within(modal).findAllByRole('listitem');
    expect(itemsInModal).toHaveLength(items.length);

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);
    const homeButton = await findAllByRole(modal, 'button', { name: 'Home' });

    expect(homeButton).toHaveLength(1);
    expect(buttonContent).toContain('testdir2');
    expect(dirs[2].isExpanded).toBe(true);

    for (let i = 0; i < dirs.length; i += 1) {
      if (i !== 2) {
        expect(buttonContent).not.toContain(makeDirName(i));
        expect(dirs[i].isExpanded).toBe(false);
      }
    }
    for (let i = 0; i < files.length; i += 1) {
      expect(buttonContent).not.toContain(makeFileName(i));
    }
  });

  it('selects and expands the parent directory of a file when the file is selected', async () => {
    const item = screen.getAllByRole('listitem')[items.length - 2];
    await user.click(item);

    const modal = await getNewItemModal();

    const itemsInModal = await within(modal).findAllByRole('listitem');
    expect(itemsInModal).toHaveLength(items.length);

    expect(dirs[2].isExpanded).toBe(true);

    for (let i = 0; i < dirs.length; i += 1) {
      if (i !== 2) {
        expect(dirs[i].isExpanded).toBe(false);
      }
    }
  });

  it('clicking breadcrumb expands correct directory', async () => {
    const item = screen.getAllByRole('listitem')[items.length - 1];
    await user.click(item);

    const modal = await getNewItemModal();
    const itemsInModal = await within(modal).findAllByRole('listitem');
    expect(itemsInModal).toHaveLength(items.length);

    const foundButtons = await findAllByRole(modal, 'button');
    const buttonContent = foundButtons.map(button => button.innerHTML);
    const homeButton = await findAllByRole(modal, 'button', { name: 'Home' });

    expect(homeButton).toHaveLength(1);
    expect(buttonContent).toContain('testdir0');
    expect(buttonContent).toContain('testdir3');

    await user.click(within(modal).getByRole('button', { name: 'testdir0' }));
    const newFoundButtons = await findAllByRole(modal, 'button');
    const newButtonContent = newFoundButtons.map(button => button.innerHTML);
    const newFoundHome = await findAllByRole(modal, 'button', { name: 'Home' });

    expect(newFoundHome).toHaveLength(1);
    expect(newButtonContent).toContain('testdir0');
    expect(newButtonContent).not.toContain('testdir3');

    expect(dirs[0].isExpanded).toBe(true);
    for (let i = 1; i < dirs.length; i += 1) {
      expect(dirs[i].isExpanded).toBe(false);
    }
  });

  it('clicking root breadcrumb collapses all directories', async () => {
    const item = screen.getAllByRole('listitem')[0];
    await user.click(item);

    const modal = await getNewItemModal();

    const itemsInModal = await within(modal).findAllByRole('listitem');
    expect(itemsInModal).toHaveLength(items.length);

    expect(dirs[0].isExpanded).toBe(true);
    for (let i = 1; i < dirs.length; i += 1) {
      expect(dirs[i].isExpanded).toBe(false);
    }

    await user.click(itemsInModal[3]);
    await user.click(itemsInModal[4]);
    expect(dirs[3].isExpanded).toBe(true);
    expect(dirs[4].isExpanded).toBe(true);
    expect(dirs[1].isExpanded).toBe(false);
    expect(dirs[2].isExpanded).toBe(false);

    await user.click(within(modal).getByRole('button', { name: 'Home' }));
    for (let i = 0; i < dirs.length; i += 1) {
      expect(dirs[i].isExpanded).toBe(false);
    }
  });
});
