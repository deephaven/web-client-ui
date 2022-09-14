import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileStorageItem } from '@deephaven/file-explorer';
import { Container } from '@deephaven/golden-layout';
import { FileExplorerPanel, FileExplorerPanelProps } from './FileExplorerPanel';
import MockFileStorage from './MockFileStorage';

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
    result.push(makeFile(`testfile${i}`));
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
  beforeEach(async () => {
    const dirs = makeDirectories();
    const fileStorage = new MockFileStorage(dirs);
    makeContainer({ fileStorage });
    const foundItems = await screen.findAllByRole('listitem');
    expect(foundItems).toHaveLength(dirs.length);
  });

  it('selects directory correctly', async () => {
    userEvent.click(screen.getAllByRole('listitem')[0]);

    userEvent.click(screen.getByRole('button', { name: 'New folder' }));

    const foundModal = await screen.findAllByRole('dialog');
    expect(foundModal).toHaveLength(1);

    const NewItemModal = foundModal[0];

    const foundPath = within(NewItemModal).getByText(/Directory/);
    expect(foundPath).toHaveTextContent(`/testdir0/`);
  });

  it('selects root directory when multiple directories are selected', async () => {
    userEvent.click(screen.getAllByRole('listitem')[0]);
    userEvent.click(screen.getAllByRole('listitem')[3]);

    userEvent.click(screen.getByRole('button', { name: 'New folder' }));

    const foundModal = await screen.findAllByRole('dialog');
    expect(foundModal).toHaveLength(1);

    const NewItemModal = foundModal[0];

    const foundPath = within(NewItemModal).getByText(/Directory/);
    expect(foundPath).toHaveTextContent(`/`);
  });

  it('selects root directory when no directories are selected', async () => {
    userEvent.click(screen.getByRole('button', { name: 'New folder' }));

    const foundModal = await screen.findAllByRole('dialog');
    expect(foundModal).toHaveLength(1);

    const NewItemModal = foundModal[0];

    const foundPath = within(NewItemModal).getByText(/Directory/);
    expect(foundPath).toHaveTextContent(`/`);
  });
});
