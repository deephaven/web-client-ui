import React from 'react';
import { render, screen } from '@testing-library/react';
import CsvOverlay from './CsvOverlay';

function makeOverlayWrapper({
  allowZip = false,
  onFileOpened = jest.fn(),
  onPaste = jest.fn(),
  clearDragError = jest.fn(),
  dragError = null,
  onError = jest.fn(),
  uploadInProgress = false,
} = {}) {
  return render(
    <CsvOverlay
      allowZip={allowZip}
      onFileOpened={onFileOpened}
      onPaste={onPaste}
      clearDragError={clearDragError}
      dragError={dragError}
      onError={onError}
      uploadInProgress={uploadInProgress}
    />
  );
}

it('renders without crashing', () => {
  makeOverlayWrapper();
});

describe('allowZip tests', () => {
  function checkExtensionAccepted(extension, isAccepted = true) {
    expect(screen.getByTestId('fileElem')).toHaveAttribute(
      'accept',
      isAccepted
        ? expect.stringContaining(extension)
        : expect.not.stringContaining(extension)
    );
  }
  it('does not accept zip in input if allowZip not true', () => {
    makeOverlayWrapper({ allowZip: false });
    checkExtensionAccepted('.zip', false);
    checkExtensionAccepted('.csv');
  });
  it('accepts zip from input if allowZip is true', () => {
    makeOverlayWrapper({ allowZip: true });
    checkExtensionAccepted('.zip');
    checkExtensionAccepted('.csv');
  });
});

describe('isValidExtension tests', () => {
  function checkName(name, expectedResult = true, allowZip = false) {
    expect(CsvOverlay.isValidExtension(name, allowZip)).toBe(expectedResult);
  }

  it('handles default types', () => {
    checkName('foo.csv');
    checkName('bar.tsv');
    checkName('baz.tab');
    checkName('faa.dsv');
    checkName('text.txt');
  });

  it('only handles zip files when allowed', () => {
    checkName('file.zip', false);
    checkName('file.zip', true, true);
  });

  it('does not accept other file extensions', () => {
    checkName('foo.exe', false);
    checkName('bar.png', false);
    checkName('baz.xls', false);
    checkName('faa.xlsx', false);
    checkName('noextension', false);
    checkName('csv', false);
  });
});
